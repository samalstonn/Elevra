import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search");

    // If no search term is provided, return a limited number of elections
    if (!searchTerm) {
      const elections = await prisma.election.findMany({
        where: process.env.NODE_ENV === "production" ? { hidden: false } : {},
        take: 10,
        orderBy: {
          date: "desc",
        },
        select: {
          id: true,
          position: true,
          date: true,
          city: true,
          state: true,
        },
      });

      return NextResponse.json(elections);
    }

    // Search for elections by position, city, or state
    const elections = await prisma.election.findMany({
      where: {
        ...(process.env.NODE_ENV === "production" ? { hidden: false } : {}),
        OR: [
          {
            position: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            city: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            state: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        position: true,
        date: true,
        city: true,
        state: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Error searching elections:", error);
    return NextResponse.json(
      { error: "Error searching elections" },
      { status: 500 }
    );
  }
}
