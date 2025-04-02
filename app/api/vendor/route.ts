import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ServiceCategoryType } from "@prisma/client";

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
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
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
        status: true,
        subscription: true,
        website: true,
        // Add other fields you want to return
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user for additional info
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const requestData = await request.json();
    console.info("Received vendor creation request:", requestData);

    // Ensure clerkUserId matches authenticated user
    if (requestData.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Invalid user ID in request" },
        { status: 400 }
      );
    }

    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { clerkUserId: userId },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: "Vendor profile already exists for this user" },
        { status: 409 }
      );
    }

    // Extract service category data
    // Check if the provided service category is valid
    const validServiceCategories = Object.values(ServiceCategoryType);
    if (!validServiceCategories.includes(requestData.serviceCategory)) {
      return NextResponse.json(
        { error: "Invalid service category provided" },
        { status: 400 }
      );
    }
    const serviceCategory = requestData.serviceCategory as ServiceCategoryType;

    // Create vendor record
    const newVendor = await prisma.vendor.create({
      data: {
        name: requestData.name,
        bio: requestData.bio,
        email: requestData.email,
        phone: requestData.phone || null,
        website: requestData.website || null,
        city: requestData.city,
        state: requestData.state,
        clerkUserId: userId,
        // Default values will be set by Prisma schema
        // status: SubmissionStatus.PENDING
        // subscription: VendorTier.FREE
      },
    });
    console.info("New vendor created with id:", newVendor.id);

    // Create service category relation if it doesn't exist
    const serviceCategoryRecord = await prisma.serviceCategory.upsert({
      where: { type: serviceCategory as ServiceCategoryType },
      update: {},
      create: {
        name: serviceCategory,
        type: serviceCategory as ServiceCategoryType,
        description: requestData.serviceDescription,
      },
    });
    console.info("Service category record upserted:", serviceCategoryRecord);

    // Create relation between vendor and service category
    console.info(
      "Connecting vendor to service category with id:",
      serviceCategoryRecord.id
    );
    await prisma.vendor.update({
      where: { id: newVendor.id },
      data: {
        serviceCategories: {
          connect: { id: serviceCategoryRecord.id },
        },
      },
    });

    return NextResponse.json(
      { success: true, vendor: newVendor },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
