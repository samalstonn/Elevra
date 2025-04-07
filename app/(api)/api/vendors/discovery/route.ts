import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { Prisma, ServiceCategory } from "@prisma/client"; // Import necessary types
import { DiscoveryVendor } from "@/types/vendor";

// Define the structure for the API response from /api/vendors/discovery
export interface VendorDiscoveryResponse {
  vendors: DiscoveryVendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Define the structure for Service Category used in filters
export type ServiceCategoryFilterItem = Pick<
  ServiceCategory,
  "id" | "name" | "type"
>;

/**
 * GET handler for discovering vendors.
 * Fetches approved vendors, allowing filtering by category and location (city/state).
 * Note: Does not perform true proximity sorting as lat/lon are not used.
 * Results matching the exact city/state are prioritized implicitly by filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId"); // Expecting ServiceCategory ID
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12"); // Default to 12 vendors per page

    // Basic validation for pagination
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }
    if (isNaN(limit) || limit < 1 || limit > 50) {
      // Limit max results per page
      return NextResponse.json(
        { error: "Invalid limit value" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Construct the Prisma where clause for filtering
    const whereClause: Prisma.VendorWhereInput = {
      // Only fetch vendors with APPROVED status
      status: "APPROVED",
    };

    // Add category filter if categoryId is provided
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId);
      if (!isNaN(categoryIdNum)) {
        whereClause.serviceCategories = {
          some: {
            id: categoryIdNum,
          },
        };
      } else {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }
    }

    // Add location filters if city and/or state are provided
    if (state) {
      whereClause.state = {
        equals: state,
        mode: "insensitive", // Case-insensitive matching for state
      };
      if (city) {
        whereClause.city = {
          equals: city,
          mode: "insensitive", // Case-insensitive matching for city
        };
      }
    } else if (city) {
      // If only city is provided, filter by city across all states
      whereClause.city = {
        equals: city,
        mode: "insensitive",
      };
    }

    // Fetch vendors based on the constructed where clause with pagination
    // --- UPDATED Select Clause ---
    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true, // ADDED: Select the slug field
        bio: true,
        website: true,
        city: true,
        state: true,
        photoUrl: true, // Include photoUrl if you added it
        serviceCategories: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
      skip: skip,
      take: limit,
    });

    // Get the total count of vendors matching the criteria for pagination info
    const totalVendors = await prisma.vendor.count({
      where: whereClause,
    });

    // Return the fetched vendors and pagination info
    // Cast the result to ensure type compatibility after select
    const discoveryVendors = vendors as DiscoveryVendor[];

    return NextResponse.json({
      vendors: discoveryVendors,
      total: totalVendors,
      page,
      limit,
      totalPages: Math.ceil(totalVendors / limit),
    });
  } catch (error) {
    // Log any errors
    console.error("Error fetching vendors for discovery:", error);
    // Return a generic error response
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
