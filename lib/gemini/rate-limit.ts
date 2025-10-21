import { Prisma, PrismaClient } from "@prisma/client";
import {
  GEMINI_DISPATCH_DEFAULT_TIME_BUDGET_MS,
  MIN_RETRY_DELAY_MS,
  getModelRateConfig,
} from "./constants";

export type RateReservationResult =
  | {
      allowed: true;
      windowStart: Date;
    }
  | {
      allowed: false;
      retryAt: Date;
      reason: RateLimitBlockReason;
    };

export type RateLimitBlockReason =
  | "rpm"
  | "tpm"
  | "rpd"
  | "batchTokens"
  | "unknown";

export type ReserveCapacityInput = {
  model: string;
  now?: Date;
  requests?: number;
  requestTokens?: number;
  responseTokens?: number;
  batchTokens?: number;
};

const MAX_RETRIES = 3;

export async function reserveModelCapacity(
  prisma: PrismaClient,
  {
    model,
    now: nowInput,
    requests = 1,
    requestTokens = 0,
    responseTokens = 0,
    batchTokens = 0,
  }: ReserveCapacityInput
): Promise<RateReservationResult> {
  const config = getModelRateConfig(model);
  if (!config) {
    return {
      allowed: true,
      windowStart: startOfMinute(nowInput ?? new Date()),
    };
  }

  const now = nowInput ?? new Date();
  const minuteStart = startOfMinute(now);
  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const row = await tx.geminiRateWindow.upsert({
            where: {
              model_windowStart: {
                model,
                windowStart: minuteStart,
              },
            },
            create: {
              model,
              windowStart: minuteStart,
            },
            update: {},
          });

          const futureRequests = row.requestCount + requests;
          if (config.rpm && futureRequests > config.rpm) {
            return {
              allowed: false,
              retryAt: addMinutes(minuteStart, 1),
              reason: "rpm" as const,
            };
          }

          const futureRequestTokens = row.requestTokens + requestTokens;
          if (config.tpm && futureRequestTokens > config.tpm) {
            return {
              allowed: false,
              retryAt: addMinutes(minuteStart, 1),
              reason: "tpm" as const,
            };
          }

          if (
            config.batchTokens &&
            row.batchTokens + batchTokens > config.batchTokens
          ) {
            return {
              allowed: false,
              retryAt: addMinutes(minuteStart, 1),
              reason: "batchTokens" as const,
            };
          }

          const dayUsage = await tx.geminiRateWindow.aggregate({
            where: {
              model,
              windowStart: {
                gte: dayStart,
                lt: dayEnd,
              },
            },
            _sum: {
              requestCount: true,
              requestTokens: true,
              responseTokens: true,
            },
          });

          const totalRequests = (dayUsage._sum.requestCount ?? 0) + requests;
          if (config.rpd && totalRequests > config.rpd) {
            return {
              allowed: false,
              retryAt: dayEnd,
              reason: "rpd" as const,
            };
          }

          const incrementData: Prisma.GeminiRateWindowUpdateInput = {};
          if (requests !== 0) {
            incrementData.requestCount = { increment: requests };
          }
          if (requestTokens !== 0) {
            incrementData.requestTokens = { increment: requestTokens };
          }
          if (responseTokens !== 0) {
            incrementData.responseTokens = { increment: responseTokens };
          }
          if (batchTokens !== 0) {
            incrementData.batchTokens = { increment: batchTokens };
          }

          if (Object.keys(incrementData).length > 0) {
            await tx.geminiRateWindow.update({
              where: {
                model_windowStart: {
                  model,
                  windowStart: minuteStart,
                },
              },
              data: incrementData,
            });
          }

          return { allowed: true, windowStart: minuteStart } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
      );
    } catch (error) {
      if (isConcurrencyConflict(error) && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }

  return {
    allowed: false,
    retryAt: new Date(Date.now() + GEMINI_DISPATCH_DEFAULT_TIME_BUDGET_MS),
    reason: "unknown",
  };
}

export async function adjustModelUsage(
  prisma: PrismaClient,
  model: string,
  windowStart: Date,
  {
    requestTokensDelta = 0,
    responseTokensDelta = 0,
    batchTokensDelta = 0,
  }: {
    requestTokensDelta?: number;
    responseTokensDelta?: number;
    batchTokensDelta?: number;
  }
): Promise<void> {
  if (
    requestTokensDelta === 0 &&
    responseTokensDelta === 0 &&
    batchTokensDelta === 0
  ) {
    return;
  }

  await prisma.geminiRateWindow.updateMany({
    where: {
      model,
      windowStart,
    },
    data: {
      requestTokens:
        requestTokensDelta !== 0
          ? { increment: requestTokensDelta }
          : undefined,
      responseTokens:
        responseTokensDelta !== 0
          ? { increment: responseTokensDelta }
          : undefined,
      batchTokens:
        batchTokensDelta !== 0 ? { increment: batchTokensDelta } : undefined,
    },
  });
}

export async function cleanupOldRateWindows(
  prisma: PrismaClient,
  olderThanDays = 2
) {
  const threshold = addDays(new Date(), -olderThanDays);
  await prisma.geminiRateWindow.deleteMany({
    where: {
      windowStart: {
        lt: threshold,
      },
    },
  });
}

export function computeBackoffDelay(retryCount: number): number {
  const base = MIN_RETRY_DELAY_MS;
  const multiplier = Math.pow(2, retryCount);
  const jitter = Math.floor(Math.random() * base);
  return base * multiplier + jitter;
}

function startOfMinute(date: Date): Date {
  const d = new Date(date.getTime());
  d.setSeconds(0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isConcurrencyConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002" || error.code === "P2034" || error.code === "P2037";
  }
  return false;
}
