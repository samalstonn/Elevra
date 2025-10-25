import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { decodeEducation } from "@/lib/education";
import { recordChangeEvent } from "@/lib/voter/changeEvents";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      country,
      stateProvince,
      city,
      state,
      website,
      degree,
      graduationYear,
      activities,
    } = body || {};
    if (!name || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
    });
    if (!candidate)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );

    const entry = `edu|${[
      name,
      country,
      stateProvince ?? "",
      city ?? "",
      state ?? "",
      website ?? "",
      degree ?? "",
      graduationYear ?? "",
      activities ?? "",
    ]
      .map((p) => String(p).replace(/\|/g, "/"))
      .join("|")}`;
    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: { history: [...candidate.history, entry] },
    });

    await recordChangeEvent({
      candidateId: candidate.id,
      type: "EDUCATION",
      summary: `Added education: ${summarizeEducation(entry)}`,
    });

    return NextResponse.json({ success: true, history: updated.history });
  } catch (e) {
    console.error("/api/candidate/education POST failed", e);
    return NextResponse.json(
      { error: "Failed to add education" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const {
      index,
      name,
      country,
      stateProvince,
      city,
      state,
      website,
      degree,
      graduationYear,
      activities,
    } = body || {};
    if (typeof index !== "number" || index < 0)
      return NextResponse.json({ error: "Missing index" }, { status: 400 });

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
    });
    if (!candidate)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    const history = [...candidate.history];
    if (index >= history.length)
      return NextResponse.json(
        { error: "Index out of range" },
        { status: 400 }
      );

    const entry = `edu|${[
      name ?? "",
      country ?? "",
      stateProvince ?? "",
      city ?? "",
      state ?? "",
      website ?? "",
      degree ?? "",
      graduationYear ?? "",
      activities ?? "",
    ]
      .map((p) => String(p).replace(/\|/g, "/"))
      .join("|")}`;
    history[index] = entry;
    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: { history },
    });

    await recordChangeEvent({
      candidateId: candidate.id,
      type: "EDUCATION",
      summary: `Updated education: ${summarizeEducation(entry)}`,
    });
    return NextResponse.json({ success: true, history: updated.history });
  } catch (e) {
    console.error("/api/candidate/education PUT failed", e);
    return NextResponse.json(
      { error: "Failed to update education" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const indexParam = url.searchParams.get("index");
    const index = indexParam ? Number(indexParam) : NaN;
    if (Number.isNaN(index))
      return NextResponse.json({ error: "Missing index" }, { status: 400 });

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
    });
    if (!candidate)
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    const removedEntry = candidate.history[index];
    const history = candidate.history.filter((_, i) => i !== index);
    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: { history },
    });

    await recordChangeEvent({
      candidateId: candidate.id,
      type: "EDUCATION",
      summary: `Removed education: ${summarizeEducation(removedEntry)}`,
    });
    return NextResponse.json({ success: true, history: updated.history });
  } catch (e) {
    console.error("/api/candidate/education DELETE failed", e);
    return NextResponse.json(
      { error: "Failed to delete education" },
      { status: 500 }
    );
  }
}

function summarizeEducation(entry: string | undefined) {
  if (!entry) return "education history changed";
  const decoded = decodeEducation(entry);
  if (!decoded) return "education history changed";
  const pieces = [
    decoded.name,
    decoded.city && decoded.state ? `${decoded.city}, ${decoded.state}` : decoded.city || decoded.state,
    decoded.graduationYear,
  ].filter(Boolean);
  return pieces.join(" • ") || "education history changed";
}
