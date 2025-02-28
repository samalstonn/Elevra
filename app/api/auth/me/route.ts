import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sessionToken = cookies().get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Look up the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    // Check if session exists and is not expired
    if (!session || session.expires < new Date()) {
      // If expired, delete the session
      if (session) {
        await prisma.session.delete({
          where: { id: session.id }
        });
      }
      
      // Clear the cookie
      cookies().delete("session_token");
      
      return NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = session.user;

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { message: "An error occurred while checking authentication" },
      { status: 500 }
    );
  }
}