import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

const querySchema = z
  .object({
    status: z.enum(["all", "unread"]).optional(),
  })
  .default({});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { voter } = await requireVoterContext();
    const baseWhere = {
      voterId: voter.id,
      ...(parsed.data.status === "unread" ? { status: "UNREAD" as const } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        take: 60,
        include: {
          changeEvent: {
            include: {
              candidate: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  currentRole: true,
                  currentCity: true,
                  currentState: true,
                  photo: true,
                  photoUrl: true,
                  verified: true,
                },
              },
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          voterId: voter.id,
          status: "UNREAD",
        },
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((notification) => ({
        id: notification.id,
        status: notification.status,
        type: notification.type,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        payload: notification.payload,
        changeEvent: notification.changeEvent
          ? {
              id: notification.changeEvent.id,
              type: notification.changeEvent.type,
              createdAt: notification.changeEvent.createdAt,
              metadata: notification.changeEvent.metadata,
              candidate: notification.changeEvent.candidate
                ? {
                    id: notification.changeEvent.candidate.id,
                    name: notification.changeEvent.candidate.name,
                    slug: notification.changeEvent.candidate.slug,
                    currentRole: notification.changeEvent.candidate.currentRole,
                    currentCity: notification.changeEvent.candidate.currentCity,
                    currentState: notification.changeEvent.candidate.currentState,
                    photo:
                      notification.changeEvent.candidate.photo ??
                      notification.changeEvent.candidate.photoUrl ??
                      null,
                    verified: notification.changeEvent.candidate.verified,
                  }
                : null,
            }
          : null,
      })),
    });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}
