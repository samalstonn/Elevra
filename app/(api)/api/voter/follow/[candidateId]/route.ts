import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

export async function DELETE(request: Request) {
  try {
    const pathname = new URL(request.url).pathname;
    const rawId = pathname.split("/").pop();
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid candidateId" }, { status: 400 });
    }
    const { voter } = await requireVoterContext();
    await prisma.follow.deleteMany({
      where: {
        voterId: voter.id,
        candidateId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}
