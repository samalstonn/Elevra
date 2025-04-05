// app/api/vendors/categories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

/**
 * GET handler to fetch all available service categories.
 * Used to populate the category filter dropdown in Vendor Discovery.
 */
export async function GET() {
  try {
    // Fetch all service categories from the database
    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true, // Include ID for filtering
        name: true, // Include name for display
        type: true, // Include type if needed for grouping/icons later
      },
      orderBy: {
        name: "asc", // Order alphabetically by name
      },
    });

    // Return the fetched categories as JSON
    return NextResponse.json(categories);
  } catch (error) {
    // Log any errors that occur during the fetch
    console.error("Error fetching service categories:", error);
    // Return a generic error response
    return NextResponse.json(
      { error: "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}
