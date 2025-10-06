// tests/utils/clerk.ts
import { Clerk } from "@clerk/backend";

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function updateUserMetadata(
  userId: string,
  data: Record<string, any>
) {
  await clerk.users.updateUser(userId, {
    publicMetadata: data,
  });
}
