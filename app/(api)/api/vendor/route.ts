// app/api/vendor/route.ts (Updated POST handler with fixes)
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
// Import Prisma namespace along with client types
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ServiceCategoryType,
  SubmissionStatus,
  VendorTier,
  Prisma,
} from "@prisma/client"; // FIXED: Import Prisma namespace
// Import the slug generation functions
import { generateUniqueSlug } from "@/lib/functions"; // Adjust path if you put it elsewhere
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

// GET handler remains the same...
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
        slug: true, // Select slug if needed elsewhere
        photoUrl: true, // Select photoUrl if needed
        createdAt: true, // Select createdAt if needed
        // Add other fields you want to return
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching vendor:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error fetching vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- UPDATED POST HANDLER ---
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
    console.info("Received vendor creation request.");

    // Ensure clerkUserId matches authenticated user
    if (requestData.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Invalid user ID in request" },
        { status: 400 }
      );
    }

    // --- Basic Validation ---
    if (
      !requestData.name ||
      !requestData.bio ||
      !requestData.email ||
      !requestData.city ||
      !requestData.state ||
      !requestData.serviceCategory
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Extract and validate service category
    const validServiceCategories = Object.values(ServiceCategoryType);
    if (!validServiceCategories.includes(requestData.serviceCategory)) {
      return NextResponse.json(
        { error: "Invalid service category provided" },
        { status: 400 }
      );
    }
    const serviceCategoryType =
      requestData.serviceCategory as ServiceCategoryType;

    // --- Generate Unique Slug ---
    const uniqueSlug = await generateUniqueSlug(requestData.name);
    console.info("Generated unique slug:", uniqueSlug);

    // Create vendor record including the slug
    const newVendor = await prisma.vendor.create({
      data: {
        name: requestData.name,
        slug: uniqueSlug, // Save the generated slug
        bio: requestData.bio,
        email: requestData.email,
        phone: requestData.phone || null,
        website: requestData.website || null,
        city: requestData.city,
        state: requestData.state,
        photoUrl: requestData.photoUrl || null, // Save photoUrl if provided
        clerkUserId: userId,
        status: SubmissionStatus.PENDING, // Explicitly set default status
        subscription: VendorTier.FREE, // Explicitly set default tier
        verified: false, // Explicitly set default verification
        // Default values will be set by Prisma schema
        // status: SubmissionStatus.PENDING
        // subscription: VendorTier.FREE
      },
    });
    console.info("New vendor created with id:", newVendor.id);

    // Find or create the service category record
    // (Assuming category name should match the type for simplicity here)
    const serviceCategoryRecord = await prisma.serviceCategory.upsert({
      where: { type: serviceCategoryType },
      update: {}, // No update needed if it exists
      create: {
        name: serviceCategoryType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()), // Simple name generation
        type: serviceCategoryType,
        description: requestData.serviceDescription || null, // Add description if provided
      },
    });
    console.info("Service category record upserted:", serviceCategoryRecord);

    // Create relation between vendor and service category
    console.info(
      "Connecting vendor to service category with id:",
      serviceCategoryRecord.id
    );
    // Use a separate update for clarity, or include in create if preferred
    const vendor = await prisma.vendor.update({
      where: { id: newVendor.id },
      data: {
        serviceCategories: {
          connect: { id: serviceCategoryRecord.id },
        },
      },
    });

    // Return the created vendor (excluding sensitive info if needed)
    const { clerkUserId: _, ...safeVendorData } = newVendor;

    // Notify admin (Resend)
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `New Vendor Signup: ${vendor.name}`,
      html: renderAdminNotification({
        title: "New Vendor Signup",
        intro: "A vendor just created a profile.",
        rows: [
          { label: "Name", value: vendor.name },
          { label: "Email", value: vendor.email },
          { label: "Phone", value: vendor.phone || "" },
        ],
      }),
    });

    return NextResponse.json(
      { success: true, vendor: safeVendorData },
      { status: 201 }
    );
  } catch (error: unknown) {
    // --- FIXED Error Handling ---
    console.error("Error creating vendor:", error);
    // Check specifically for Prisma Known Request Errors first
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Check for unique constraint violation (e.g., on slug or email)
      if (error.code === "P2002") {
        // Access error.code safely here
        return NextResponse.json(
          {
            error:
              "A vendor with this identifier (possibly slug or email) already exists.",
          },
          { status: 409 }
        );
      }
      // Handle other known Prisma errors if needed
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    // Handle generic JavaScript errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Handle any other unknown errors
    return NextResponse.json(
      { error: "An unknown error occurred during vendor creation." },
      { status: 500 }
    );
  }
}
