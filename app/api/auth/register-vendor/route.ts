import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // Get auth session to verify clerk user ID
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      clerkUserId,
      name,
      email,
      phone,
      city,
      state,
      bio,
    } = body;

    // Validate clerkUserId matches authenticated user
    if (userId !== clerkUserId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Check if vendor with clerkUserId already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { clerkUserId },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: "Vendor already registered with this account" },
        { status: 400 }
      );
    }

    // Create new vendor
    const vendor = await prisma.vendor.create({
      data: {
        name,
        bio: bio || "",
        email,
        phone: phone || null,
        city,
        state,
        clerkUserId,
        verified: false,
        subscription: "FREE",
      },
    });

    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error("Error registering vendor:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 