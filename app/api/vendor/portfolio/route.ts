import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Check if the vendor exists and belongs to the authenticated user
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        portfolio: true,
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

    // Check if the vendor subscription allows more portfolio items
    if (
      (vendor.subscription === "FREE" && vendor.portfolio.length >= 3) ||
      (vendor.subscription === "STANDARD" && vendor.portfolio.length >= 10)
    ) {
      return NextResponse.json(
        {
          error: "Portfolio item limit reached for your subscription tier",
          currentCount: vendor.portfolio.length,
          maxAllowed:
            vendor.subscription === "FREE"
              ? 3
              : vendor.subscription === "STANDARD"
              ? 10
              : "unlimited",
        },
        { status: 403 }
      );
    }

    // Create new portfolio item
    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        vendorId,
        title,
        description,
        imageUrl: imageUrl || "",
      },
    });

    return NextResponse.json(portfolioItem);
  } catch (error: any) {
    console.error("Error creating portfolio item:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
