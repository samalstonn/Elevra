import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: Request) {
  console.log("GET request received");
  const url = new URL(request.url);
  const candidateID = url.searchParams.get("candidateID");

  console.log(`candidateID from URL: ${candidateID}`);

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

  console.log(`viewCount: ${viewCount}`);

  return NextResponse.json({ viewCount });
}
