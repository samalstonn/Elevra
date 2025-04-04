import {
  Vendor as PrismaVendor,
  ServiceCategory as PrismaServiceCategory,
  PortfolioItem as PrismaPortfolioItem,
  Testimonial as PrismaTestimonial,
  Candidate as PrismaCandidate,
} from "@prisma/client";

// Vendor structure for Discovery Page
// UPDATED: Added slug
export type DiscoveryVendor = Pick<
  PrismaVendor,
  "id" | "name" | "slug" | "bio" | "website" | "city" | "state" | "photoUrl"
> & {
  serviceCategories: Pick<PrismaServiceCategory, "id" | "name" | "type">[];
};

// API Response for Discovery Page
export interface VendorDiscoveryResponse {
  vendors: DiscoveryVendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Service Category for Filters
export type ServiceCategoryFilterItem = Pick<
  PrismaServiceCategory,
  "id" | "name" | "type"
>;

// --- Types for Vendor Profile Page ---

// Type for a single portfolio item displayed on the profile
export type VendorProfilePortfolioItem = Pick<
  PrismaPortfolioItem,
  "id" | "title" | "imageUrl" | "description"
>;

// Type for a single testimonial displayed on the profile
export type VendorProfileTestimonial = Pick<
  PrismaTestimonial,
  "id" | "content" | "rating" | "createdAt"
> & {
  candidate: Pick<PrismaCandidate, "id" | "name" | "photo">; // Include candidate details
};

// Type for the full public vendor profile data fetched by the API
export type PublicVendorProfileData = Pick<
  PrismaVendor,
  | "id"
  | "name"
  | "bio"
  | "website"
  | "city"
  | "state"
  | "verified"
  | "photoUrl"
  | "createdAt"
  | "slug" // Ensure slug is here too
> & {
  serviceCategories: Pick<PrismaServiceCategory, "id" | "name" | "type">[];
  portfolio: VendorProfilePortfolioItem[];
  testimonials: VendorProfileTestimonial[];
};
