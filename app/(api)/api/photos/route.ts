import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(req: NextRequest) {
  const { key, url, uploadedBy } = await req.json();
  if (!key || !url || !uploadedBy) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    const photo = await prisma.photo.create({
      data: { key, url, uploadedBy },
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error("Create photo error:", err);
    return NextResponse.json(
      { error: "Failed to save photo" },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uploadedBy = searchParams.get("uploadedBy");
  if (!uploadedBy) {
    return NextResponse.json(
      { error: "Missing uploadedBy parameter" },
      { status: 400 }
    );
  }
  const photos = await prisma.photo.findMany({
    where: { uploadedBy },
    orderBy: { createdAt: "desc" },
    select: { url: true },
  });
  return NextResponse.json(photos);
}
