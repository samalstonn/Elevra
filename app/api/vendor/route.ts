import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    // Get auth session to verify the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the clerkUserId from query parameters
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get("clerkUserId");

    // Ensure the requested clerkUserId matches the authenticated user
    if (!clerkUserId || clerkUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Find the vendor in the database
    const vendor = await prisma.vendor.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        name: true,
        bio: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        verified: true,
        subscription: true,
        website: true,
        // Add other fields you want to return
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 