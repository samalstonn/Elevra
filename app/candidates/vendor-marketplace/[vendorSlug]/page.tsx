import { notFound } from "next/navigation";
import VendorProfileClient from "./VendorProfileClient"; // Client component for interactivity
import type { PublicVendorProfileData } from "@/types/vendor"; // Import the type for vendor data
import { Metadata } from "next";
import prisma from "@/prisma/prisma"; // Import Prisma client
import { Prisma } from "@prisma/client"; // Import Prisma types if needed for query

// Define props for the page component, including params for the dynamic route
interface VendorProfilePageProps {
  params: {
    vendorSlug: string;
  };
}

// --- Function to Fetch Vendor Data Directly ---
// This function encapsulates the Prisma query logic
async function getVendorProfile(
  slug: string
): Promise<PublicVendorProfileData | null> {
  try {
    const vendorProfile = await prisma.vendor.findUnique({
      where: {
        slug: slug,
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
        createdAt: true,
        slug: true, // Include slug if needed by client components
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
            // Example: Order portfolio items if you add an 'order' or 'createdAt' field
            // createdAt: 'asc',
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
            createdAt: "desc", // Show newest testimonials first
          },
          take: 5, // Example: Limit initial testimonials if needed
        },
      },
    });
    return vendorProfile as PublicVendorProfileData | null; // Cast might be needed depending on strictness
  } catch (error) {
    console.error(
      `Prisma error fetching vendor profile for slug '${slug}':`,
      error
    );
    // Depending on error handling strategy, you might return null or throw
    return null;
  }
}

// --- Metadata Generation ---
// Updated to use the direct data fetching function
export async function generateMetadata({
  params,
}: VendorProfilePageProps): Promise<Metadata> {
  const vendorSlug = params.vendorSlug;
  const vendor = await getVendorProfile(vendorSlug); // Use direct fetch

  if (vendor) {
    return {
      title: `${vendor.name} - Vendor Profile | Elevra`, // Dynamic title
      description: `View the profile, portfolio, and reviews for ${vendor.name}.`, // Dynamic description
    };
  } else {
    // Handle case where vendor is not found for metadata
    return {
      title: "Vendor Not Found | Elevra",
      description: "The requested vendor profile could not be found.",
    };
  }
}

// --- Main Page Component (Server Component) ---
// Fetches data directly using Prisma and passes it to the client component
export default async function VendorProfilePage({
  params,
}: VendorProfilePageProps) {
  const vendorSlug = await params.vendorSlug;

  // --- Data Fetching using direct Prisma access ---
  const vendorData = await getVendorProfile(vendorSlug);

  // --- Handle Not Found ---
  // If vendorData is null (either not found, not approved, or DB error)
  if (!vendorData) {
    console.log(
      `Vendor profile not found or failed to load for slug '${vendorSlug}'. Triggering 404.`
    );
    notFound(); // Trigger Next.js 404 page
  }

  // --- Render Vendor Profile ---
  // Pass the fetched data to the client component for rendering the UI
  // The 'vendorData' is guaranteed to be non-null here due to the check above
  return <VendorProfileClient vendor={vendorData} />;
}
