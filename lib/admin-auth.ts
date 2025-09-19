import { clerkClient } from "@clerk/nextjs/server";

export type AdminFlags = {
  isAdmin: boolean;
  isSubAdmin: boolean;
};

/**
 * Fetches admin/sub-admin flags from Clerk private metadata.
 * Returns falsey flags when the user cannot be loaded.
 */
export async function getAdminFlags(userId: string | null | undefined): Promise<AdminFlags> {
  if (!userId) {
    return { isAdmin: false, isSubAdmin: false };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      isAdmin: Boolean(user.privateMetadata?.isAdmin),
      isSubAdmin: Boolean(user.privateMetadata?.isSubAdmin),
    };
  } catch (error) {
    console.error("Failed to load admin flags for user", userId, error);
    return { isAdmin: false, isSubAdmin: false };
  }
}

export async function requireAdminOrSubAdmin(
  userId: string | null | undefined
): Promise<AdminFlags | null> {
  const flags = await getAdminFlags(userId);
  if (flags.isAdmin || flags.isSubAdmin) {
    return flags;
  }
  return null;
}

