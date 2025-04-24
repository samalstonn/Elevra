import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma"; // Adjust the import path to match your project structure
import { normalizeState } from "@/lib/stateMapping";
import { Office } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const rawState = searchParams.get("state");

    if (!city || !rawState) {
      return NextResponse.json(
        { error: "City and state are required query parameters" },
        { status: 400 }
      );
    }

    // Normalize the state value (handle both abbreviations and full names)
    const normalizedState = normalizeState(rawState);

    // If city is 'all', return all offices (for dropdown lists)
    if (city === "all" && normalizedState === "all") {
      const allOffices = await prisma.office.findMany({
        where: {
          hidden: false,
          NOT: {
            OR: [{ city: { equals: "" } }, { state: { equals: "" } }],
          },
        },
        select: {
          id: true,
          city: true,
          state: true,
          position: true,
        },
        orderBy: [
          {
            city: "asc",
          },
          {
            state: "asc",
          },
        ],
      });

      return NextResponse.json(allOffices);
    }

    let offices: Office[] = [];

    if (normalizedState) {
      offices = await prisma.office.findMany({
        where: {
          city,
          state: normalizedState,
        },
        include: {
          candidates: true,
        },
      });
    }

    // If no results with normalized state, try with raw state as fallback
    if (offices.length === 0) {
      console.log(
        `No results found with normalized state '${normalizedState}', trying with raw state '${rawState}'`
      );

      offices = await prisma.office.findMany({
        where: {
          city,
          state: rawState,
        },
        include: {
          candidates: true,
        },
      });
    }

    return NextResponse.json(offices);
  } catch (error) {
    console.error("Error fetching offices:", error);
    return NextResponse.json(
      { error: "Error fetching offices" },
      { status: 500 }
    );
  }
}
