// app/api/vendor/profile/route.ts (Updated PUT handler)
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
// Import the slug generation functions
import { generateUniqueSlug } from "@/lib/functions"; // Adjust path if you put it elsewhere

export async function PUT(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      vendorId, // ID of the vendor to update
      name,
      bio,
      email,
      phone,
      website,
      city,
      state,
      photoUrl, // Allow updating photoUrl
      serviceCategories, // Array of service category IDs
    } = body;

    // Validate required fields for update
    if (!vendorId || !name || !bio || !email || !city || !state) {
      return NextResponse.json(
        { error: "Missing required fields for update" },
        { status: 400 }
      );
    }

    // Validate vendorId is a number
    const vendorIdNum = Number(vendorId);
    if (isNaN(vendorIdNum)) {
      return NextResponse.json({ error: "Invalid Vendor ID" }, { status: 400 });
    }

    // Example validation for email
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate service categories array (ensure they are numbers)
    let categoryIds: number[] = [];
    if (serviceCategories && Array.isArray(serviceCategories)) {
      categoryIds = serviceCategories
        .map((id) => Number(id))
        .filter((id) => !isNaN(id)); // Filter out any non-numeric IDs

      if (categoryIds.length !== serviceCategories.length) {
        return NextResponse.json(
          { error: "Invalid service category IDs provided" },
          { status: 400 }
        );
      }
      // Validate that all service categories exist
      const categoryCount = await prisma.serviceCategory.count({
        where: { id: { in: categoryIds } },
      });
      if (categoryCount !== categoryIds.length) {
        return NextResponse.json(
          { error: "One or more service categories are invalid" },
          { status: 400 }
        );
      }
    } else if (serviceCategories) {
      // Handle case where serviceCategories is provided but not an array
      return NextResponse.json(
        { error: "Service categories must be an array of IDs" },
        { status: 400 }
      );
    }

    // Fetch the vendor to verify ownership and check if name changed
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorIdNum },
      include: {
        serviceCategories: true, // Include current categories for disconnect logic
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check ownership
    if (vendor.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to update this vendor" },
        { status: 403 }
      );
    }

    // --- Slug Generation Logic ---
    let newSlug: string | undefined = undefined;
    // Generate a new slug ONLY if the name has changed
    if (name && name !== vendor.name) {
      console.info(
        `Vendor name changed from "${vendor.name}" to "${name}". Generating new slug.`
      );
      newSlug = await generateUniqueSlug(name, vendorIdNum); // Pass vendor ID to exclude itself
      console.info("Generated new unique slug:", newSlug);
    }

    // Prepare data for update
    const updateData: Prisma.VendorUpdateInput = {
      name,
      bio,
      email,
      phone: phone || null,
      website: website || null,
      city,
      state,
      photoUrl: photoUrl, // Update photoUrl (allows setting to null)
      ...(newSlug && { slug: newSlug }), // Include slug only if it was generated
      // Service categories are handled in the transaction below
    };

    // Use transaction to safely update vendor and relations
    const updatedVendor = await prisma.$transaction(async (prisma) => {
      // 1. Update basic vendor fields (including potentially the slug)
      const partiallyUpdatedVendor = await prisma.vendor.update({
        where: { id: vendorIdNum },
        data: updateData,
        include: { serviceCategories: true }, // Re-include for step 2
      });

      // 2. Update Service Category connections if provided
      if (serviceCategories !== undefined) {
        // Check if the array was provided (even if empty)
        // Disconnect all existing categories
        await prisma.vendor.update({
          where: { id: vendorIdNum },
          data: {
            serviceCategories: {
              set: [], // Disconnect all first
            },
          },
        });
        // Connect the new set of categories
        if (categoryIds.length > 0) {
          await prisma.vendor.update({
            where: { id: vendorIdNum },
            data: {
              serviceCategories: {
                connect: categoryIds.map((id: number) => ({ id })),
              },
            },
          });
        }
      }

      // 3. Fetch the final updated vendor data with relations
      return prisma.vendor.findUnique({
        where: { id: vendorIdNum },
        include: { serviceCategories: true },
      });
    });

    if (!updatedVendor) {
      // Should not happen if the initial findUnique succeeded, but good practice
      throw new Error(
        "Failed to retrieve updated vendor data after transaction."
      );
    }

    // Return the updated vendor data (excluding sensitive info)
    const { clerkUserId: _, ...safeVendorData } = updatedVendor;
    return NextResponse.json(safeVendorData);
  } catch (error: unknown) {
    console.error("Error updating vendor profile:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Handle potential unique constraint error on slug update
      return NextResponse.json(
        {
          error:
            "Failed to update profile. The generated identifier (slug) might already be in use.",
        },
        { status: 409 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred during vendor profile update." },
      { status: 500 }
    );
  }
}
