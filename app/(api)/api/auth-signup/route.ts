// app/api/auth-signup/route.ts
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export async function POST(req: Request) {
  const {
    firstName,
    lastName,
    email,
    password,
    name,
    currentRole,
    bio,
    city,
    state,
    website,
    linkedin,
  } = await req.json();

  // 1️⃣ Instantiate the Clerk client
  const client = await clerkClient();

  try {
    // 2️⃣ Create the user
    const user = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
      publicMetadata: { role: "candidate" },
    });

    console.log("User created:", user);
    console.log("User ID:", user.id);

    // Call the post method api at /api/candidate/
    // Determine the base origin to call the candidate API
    const origin = new URL(req.url).origin;
    try {
      await fetch(`${origin}/api/candidate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          firstName,
          lastName,
          email,
          name,
          currentRole,
          bio,
          currentCity: city,
          currentState: state,
          website,
          linkedin,
          clerkuserid: user.id,
        }),
      });
    } catch (error) {
      console.error("Error creating candidate:", error);
      return NextResponse.json(
        { error: "Failed to create candidate" },
        { status: 500 }
      );
    }

    // 5️⃣ Attach the session cookie
    const response = NextResponse.json({ success: true });
    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    const message = err.errors?.[0]?.message || err.message || "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
