import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma"; // Adjust the import path to match your project structure

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany();
    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Error fetching candidates" },
      { status: 500 }
    );
  }
}
