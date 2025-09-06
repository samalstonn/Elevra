import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    const current = (user.publicMetadata as any) || {};

    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...current,
        visitedCandidateDashboard: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to set visitedCandidateDashboard metadata", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

