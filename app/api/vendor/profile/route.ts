import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

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
      vendorId,
      name,
      bio,
      email,
      phone,
      website,
      city,
      state,
      serviceCategories,
    } = body;

    // Validate required fields
    if (!vendorId || !name || !bio || !email || !city || !state) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the vendor exists and belongs to the authenticated user
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        ServiceCategory: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to update this vendor" },
        { status: 403 }
      );
    }

    // Prepare transaction for vendor update and service category connections
    const updatedVendor = await prisma.$transaction(async (prisma) => {
      // First, disconnect all current service categories
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          ServiceCategory: {
            disconnect: vendor.ServiceCategory.map((category) => ({
              id: category.id,
            })),
          },
        },
      });

      // Then, update vendor with new data and connect new service categories
      return prisma.vendor.update({
        where: { id: vendorId },
        data: {
          name,
          bio,
          email,
          phone: phone || null,
          website: website || null,
          city,
          state,
          ServiceCategory: {
            connect: serviceCategories.map((id: number) => ({ id })),
          },
        },
        include: {
          ServiceCategory: true,
        },
      });
    });

    return NextResponse.json(updatedVendor);
  } catch (error: any) {
    console.error("Error updating vendor profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
