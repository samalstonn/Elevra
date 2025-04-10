import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";

// Define the shape of the data we want to return for a public profile
// UPDATED: Added createdAt to the selection
export type PublicVendorProfile = Prisma.VendorGetPayload<{
  select: {
    id: true;
    name: true;
    bio: true;
    website: true;
    city: true;
    state: true;
    verified: true; // Include verification status
    photoUrl: true; // Include photo URL
    createdAt: true; // ADDED: Include the creation date
    serviceCategories: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    portfolio: {
      select: {
        id: true;
        title: true;
        imageUrl: true;
        description: true;
      };
    };
    testimonials: {
      select: {
        id: true;
        content: true;
        rating: true;
        createdAt: true;
        candidate: {
          // Include candidate info for the testimonial
          select: {
            id: true;
            name: true;
            photo: true; // Candidate photo for avatar
          };
        };
      };
      orderBy: {
        createdAt: "desc"; // Show newest testimonials first
      };
    };
    // Exclude sensitive fields like email, phone, clerkUserId, status, subscription
  };
}>;

/**
 * GET handler to fetch public profile data for a specific vendor by slug.
 */
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);

    const vendorSlug = pathname.split("/").pop(); // Extract the slug from the URL

    if (!vendorSlug) {
      return NextResponse.json(
        { error: "Vendor slug is required" },
        { status: 400 }
      );
    }

    // Fetch the vendor profile using the unique slug
    // UPDATED: Added createdAt to the select clause
    const vendorProfile: PublicVendorProfile | null =
      await prisma.vendor.findUnique({
        where: {
          slug: vendorSlug,
          status: "APPROVED", // IMPORTANT: Only fetch approved vendors publicly
        },
        // Select only the fields needed for the public profile
        select: {
          id: true,
          name: true,
          bio: true,
          website: true,
          city: true,
          state: true,
          verified: true,
          photoUrl: true,
          createdAt: true, // ADDED: Select createdAt
          serviceCategories: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          portfolio: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              description: true,
            },
            orderBy: {
              // Assuming you add a createdAt or order field to PortfolioItem
              // createdAt: 'desc'
            },
          },
          testimonials: {
            select: {
              id: true,
              content: true,
              rating: true,
              createdAt: true,
              candidate: {
                // Include related candidate data
                select: {
                  id: true,
                  name: true,
                  photo: true, // Candidate's photo
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    // If no vendor found or vendor is not approved, return 404
    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Return the public profile data
    return NextResponse.json(vendorProfile);
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor profile" },
      { status: 500 }
    );
  }
}
