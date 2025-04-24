// lib/api/schemas.ts

import { z } from "zod";

/**
 * Common schema fragments for reuse in API validation
 */
export const Schemas = {
  // Pagination
  pagination: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1))
      .refine((val) => val > 0, { message: "Page must be a positive number" }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10))
      .refine((val) => val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
  }),

  // ID parameter
  id: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val > 0, { message: "Invalid ID format" }),

  // Date range
  dateRange: z.object({
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => !val || !isNaN(val.getTime()), {
        message: "Invalid start date",
      }),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => !val || !isNaN(val.getTime()), {
        message: "Invalid end date",
      }),
  }),

  // Location
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
  }),

  // Enum schemas based on your Prisma enums
  electionType: z.enum(["LOCAL", "STATE", "NATIONAL", "UNIVERSITY"]),
  vendorTier: z.enum(["FREE", "STANDARD", "PREMIUM"]),
  submissionStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  serviceCategoryType: z.enum([
    "CREATIVE_BRANDING",
    "DIGITAL_TECH",
    "PHYSICAL_MEDIA",
    "CONSULTING_PR",
    "OTHER",
  ]),
};
