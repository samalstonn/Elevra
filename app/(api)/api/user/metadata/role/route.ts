import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const bodySchema = z.object({
  role: z.enum(["candidate", "voter"]),
});

export async function POST(req: Request) {
  const parsedBody = await req.json().catch(() => null);
  const validation = bodySchema.safeParse(parsedBody);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const existingMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

    const updates: Record<string, unknown> = { ...existingMetadata };
    if (validation.data.role === "candidate") {
      updates.isCandidate = true;
    } else {
      updates.isVoter = true;
    }

    await clerk.users.updateUser(userId, {
      publicMetadata: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update user role metadata", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
