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
 * Generates a unique slug for a vendor or candidate based on their name.
 * Checks the database for existing slugs and appends a number if necessary.
 * @param name - The vendor or candidate name to base the slug on.
 * @param IdToExclude - Optional. If updating an existing vendor or candidate, provide their ID to exclude it from the uniqueness check.
 * @param entity - The type of entity for which to generate the slug, either "vendor" or "candidate". Defaults to "vendor".
 * @returns A unique slug string.
 */
export async function generateUniqueSlug(
  name: string,
  IdToExclude?: number,
  entity: "vendor" | "candidate" = "vendor"
): Promise<string> {
  if (!name) {
    throw new Error("Name is required to generate a unique slug.");
  }

  const slug = normalizeSlug(name);
  let uniqueSlug = slug;
  let counter = 1;

  // Loop to find a unique slug
  while (true) {
    // Check if the current slug exists in the database
    const existingRecord =
      entity === "vendor"
        ? await prisma.vendor.findFirst({
            where: {
              slug: uniqueSlug,
              NOT: IdToExclude ? { id: IdToExclude } : undefined,
            },
            select: { id: true }, // Only select ID for efficiency
          })
        : await prisma.candidate.findFirst({
            where: {
              slug: uniqueSlug,
              NOT: IdToExclude ? { id: IdToExclude } : undefined,
            },
            select: { id: true }, // Only select ID for efficiency
          });

    // If no vendor or candidate with this slug exists (or it's the vendor or candidate being updated), the slug is unique
    if (!existingRecord) {
      break; // Exit the loop
    }

    // If the slug exists, append a counter and try again
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

//prettier-ignore
const STRIPE_FIXED_FEE = 0.30; // $0.30 per transaction
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%

/**
 * Calculates the Stripe processing fee based on the base amount.
 * The formula is:
 * 1. Add fixed fee
 * 2. Divide by (1 - percentage)
 * 3. Subtract base amount to get fee
 * 4. Round to 2 decimal places
 * @param baseAmount - The base amount in dollars.
 * @returns The calculated fee in dollars.
 */
export const calculateFee = (baseAmount: number): number => {
  if (baseAmount <= 0) return 0;

  // Step 1: Add fixed fee
  const amountPlusFixed = baseAmount + STRIPE_FIXED_FEE;

  // Step 2: Divide by (1 - percentage)
  const grossAmount = amountPlusFixed / (1 - STRIPE_PERCENTAGE_FEE);

  // Step 3: Subtract base amount to get fee
  const fee = grossAmount - baseAmount;

  // Step 4: Round to 2 decimal places
  return Math.round(fee * 100) / 100;
};
