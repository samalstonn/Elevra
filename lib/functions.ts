import prisma from "@/prisma/prisma"; // Required if in a separate file

// Assumes normalizeSlug is in this file or imported
export function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, "-")
    .trim();
}

/**
 * Generates a unique slug for a vendor based on their name.
 * Checks the database for existing slugs and appends a number if necessary.
 * @param name - The vendor name to base the slug on.
 * @param vendorIdToExclude - Optional. If updating an existing vendor, provide their ID to exclude it from the uniqueness check.
 * @returns A unique slug string.
 */
export async function generateUniqueSlug(
  name: string,
  vendorIdToExclude?: number
): Promise<string> {
  if (!name) {
    // Fallback for empty names, though validation should prevent this
    return `vendor-${Date.now()}`;
  }

  let slug = normalizeSlug(name);
  let uniqueSlug = slug;
  let counter = 1;

  // Loop to find a unique slug
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if the current slug exists in the database
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        slug: uniqueSlug,
        // If updating, exclude the current vendor's ID from the check
        NOT: vendorIdToExclude ? { id: vendorIdToExclude } : undefined,
      },
      select: { id: true }, // Only select ID for efficiency
    });

    // If no vendor with this slug exists (or it's the vendor being updated), the slug is unique
    if (!existingVendor) {
      break; // Exit the loop
    }

    // If the slug exists, append a counter and try again
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}
