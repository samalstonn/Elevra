import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

const payloadSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { voter } = await requireVoterContext();
    const { count } = await prisma.notification.updateMany({
      where: {
        voterId: voter.id,
        id: { in: parsed.data.ids },
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, updated: count });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}
