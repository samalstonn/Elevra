import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { enqueueDailyDigestEmail } from "@/lib/email/voterQueue";

function authorize(request: Request) {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.VERCEL_CRON_SECRET,
  ].filter(Boolean) as string[];
  if (secrets.length === 0) return true;

  const candidates: string[] = [];
  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader) {
    candidates.push(cronHeader.trim());
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();
    candidates.push(trimmed);
    if (/^bearer\s+/i.test(trimmed)) {
      candidates.push(trimmed.replace(/^bearer\s+/i, "").trim());
    }
  }
  if (candidates.length === 0) return false;

  return secrets.some((secret) => candidates.includes(secret));
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const preferences = await prisma.voterPreference.findMany({
    where: {
      emailMode: "DAILY_DIGEST",
    },
    include: {
      voter: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  for (const pref of preferences) {
    const digestCutoff = pref.lastDigestSentAt ?? cutoff;
    const notifications = await prisma.notification.findMany({
      where: {
        voterId: pref.voter.id,
        createdAt: {
          gt: digestCutoff,
        },
      },
      include: {
        changeEvent: {
          include: {
            candidate: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (notifications.length === 0) {
      continue;
    }

    const items = notifications
      .filter((notification) => notification.changeEvent && notification.changeEvent.candidate)
      .map((notification) => ({
        candidateName: notification.changeEvent!.candidate!.name,
        summary:
          (notification.payload as { summary?: string } | null)?.summary ??
          (notification.changeEvent!.metadata as { summary?: string } | null)?.summary ??
          "Campaign update",
        updateType: notification.changeEvent!.type,
        candidateSlug: notification.changeEvent!.candidate!.slug,
        occurredAt: notification.changeEvent!.createdAt,
      }));

    if (items.length === 0) {
      continue;
    }

    enqueueDailyDigestEmail({
      voterEmail: pref.voter.email,
      voterName: pref.voter.email.split("@")[0],
      items,
    });

    await prisma.voterPreference.update({
      where: { id: pref.id },
      data: { lastDigestSentAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
