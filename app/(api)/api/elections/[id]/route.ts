import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  console.log("GET request received");
  try {
    const { searchParams, pathname } = new URL(request.url);
    const _ = searchParams.get("search");
    const parts = pathname.split("/");
    const idStr = parts[parts.length - 1];
    if (!idStr) {
      return NextResponse.json(
        { message: "Office ID is required" },
        { status: 400 }
      );
    }
    const officeId = parseInt(idStr);

    console.log("Office ID:", officeId);

    const office = await prisma.office.findUnique({
      where: {
        id: officeId,
      },
    });

    // Get the office by ID
    if (!office) {
      return NextResponse.json(
        { message: "Office not found" },
        { status: 404 }
      );
    }

    // Return the office data including city and state
    return NextResponse.json({
      id: office.id,
      city: office.city,
      state: office.state,
    });
  } catch (error) {
    console.error("Error fetching office:", error);
    return NextResponse.json(
      { message: "Error fetching office data" },
      { status: 500 }
    );
  }
}
