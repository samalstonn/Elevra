import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

export async function POST() {
  try {
    const { voter } = await requireVoterContext();
    const { count } = await prisma.notification.updateMany({
      where: {
        voterId: voter.id,
        status: "UNREAD",
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
