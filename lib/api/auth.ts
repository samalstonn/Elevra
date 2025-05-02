// lib/api/auth.ts

import { auth } from "@clerk/nextjs/server";
import { AuthenticationError, AuthorizationError } from "./errors/error-types";
import { logger } from "../logger";

/**
 * Ensures a user is authenticated
 * @returns The authenticated user ID
 * @throws AuthenticationError if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthenticationError();
  }

  return userId;
}

/**
 * Verifies resource ownership
 * @param resourceOwnerId The ID of the resource owner
 * @param message Optional custom error message
 * @throws AuthorizationError if user doesn't own the resource
 */
export async function requireOwnership(
  resourceOwnerId: string | null | undefined,
  message?: string
): Promise<void> {
  const userId = await requireAuth();

  if (!resourceOwnerId || userId !== resourceOwnerId) {
    throw new AuthorizationError(
      message || "You do not have permission to access this resource"
    );
  }
}

/**
 * Checks if user has admin role
 * Note: Implement your own admin role check logic here
 * @throws AuthorizationError if user is not an admin
 */
export async function requireAdmin(): Promise<string> {
  const userId = await requireAuth();

  // Replace with your admin checking logic
  const isAdmin = await checkIfUserIsAdmin(userId);

  if (!isAdmin) {
    throw new AuthorizationError("Admin access required");
  }

  return userId;
}

/**
 * Example function to check if a user is an admin
 * Replace this with your actual implementation
 */
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  // Example implementation - replace with your own
  // e.g., fetch user from database and check roles
  // For now, return false as placeholder
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
  if (process.env.NODE_ENV === "production" && adminUserIds.length === 0) {
    // Warn or fail fast if no admin IDs are configured
    logger.warn(
      "ADMIN_USER_IDS is not set or empty. No admin users will be recognized."
    );
  }
  return adminUserIds.includes(userId);
}
