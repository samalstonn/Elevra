// tests/utils/clerk.ts
import { createClerkClient } from "@clerk/backend";

const ClerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function updateUserMetadata(
  userId: string,
  data: Record<string, any>
) {
  try {
    const result = await ClerkClient.users.updateUserMetadata(userId, {
      publicMetadata: data,
    });
    return result;
  } catch (error) {
    console.error("Error updating user metadata:", error);
    throw error;
  }
}

export async function removeUserMetadata(userId: string, keys: string[]) {
  try {
    const user = await ClerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};

    const updatedMetadata = { ...currentMetadata };
    keys.forEach((key) => {
      delete updatedMetadata[key];
    });

    const result = await ClerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });
    return result;
  } catch (error) {
    console.error("Error removing user metadata:", error);
    throw error;
  }
}
