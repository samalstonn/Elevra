import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search");

    // If no search term is provided, return a limited number of offices
    if (!searchTerm) {
      const offices = await prisma.office.findMany({
        take: 10,
        select: {
          id: true,
          position: true,
          city: true,
          state: true,
        },
      });

      return NextResponse.json(offices);
    }

    // Search for offices by position, city, or state
    const offices = await prisma.office.findMany({
      where: {
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
        city: true,
        state: true,
      },
      take: 10,
    });

    return NextResponse.json(offices);
  } catch (error) {
    console.error("Error searching offices:", error);
    return NextResponse.json(
      { error: "Error searching offices" },
      { status: 500 }
    );
  }
}
