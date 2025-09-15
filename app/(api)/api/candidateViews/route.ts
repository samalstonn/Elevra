import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateID = url.searchParams.get("candidateID");

  if (!candidateID || isNaN(Number(candidateID))) {
    console.log("Invalid or missing candidateID parameter");
    return NextResponse.json(
      { error: "Invalid or missing candidateID parameter" },
      { status: 400 }
    );
  }

  const viewCount = await prisma.candidateProfileView.count({
    where: {
      candidateId: Number(candidateID),
    },
  });

  return NextResponse.json({ viewCount });
}
