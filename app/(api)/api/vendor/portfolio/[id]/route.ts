import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

// Update an existing portfolio item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = parseInt((await params).id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "Invalid portfolio item ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { vendorId, title, description, imageUrl } = body;

    // Validate required fields
    if (!vendorId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the portfolio item exists
    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: { id: itemId },
      include: { vendor: true },
    });

    if (!portfolioItem) {
      return NextResponse.json(
        { error: "Portfolio item not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this portfolio item
    if (portfolioItem.vendor.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to edit this portfolio item" },
        { status: 403 }
      );
    }

    // Update the portfolio item
    const updatedItem = await prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        title,
        description,
        imageUrl: imageUrl || "",
      },
    });

  return NextResponse.json(updatedItem);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error updating candidate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Delete a portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = parseInt((await params).id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "Invalid portfolio item ID" },
        { status: 400 }
      );
    }

    // Verify the portfolio item exists
    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: { id: itemId },
      include: { vendor: true },
    });

    if (!portfolioItem) {
      return NextResponse.json(
        { error: "Portfolio item not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this portfolio item
    if (portfolioItem.vendor.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to delete this portfolio item" },
        { status: 403 }
      );
    }

    // Delete the portfolio item
    await prisma.portfolioItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error updating candidate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
