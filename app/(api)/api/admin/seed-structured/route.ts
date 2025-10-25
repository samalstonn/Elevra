/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { seedStructuredData } from "@/lib/admin/seedStructured";

export async function POST(req: NextRequest) {
  try {
    const headerSecret =
      req.headers.get("x-e2e-seed-secret") || req.headers.get("x-seed-secret");
    const envSecret = process.env.E2E_SEED_SECRET || "";
    const bypassAuth = Boolean(
      headerSecret && envSecret && headerSecret === envSecret
    );

    const { userId } = await auth();
    async function isAdmin(u: string | null): Promise<boolean> {
      if (!u) return false;
      const raw = process.env.ADMIN_USER_IDS || "";
      const matches: string[] = raw.match(/user_[A-Za-z0-9]+/g) || [];
      if (matches.includes(u)) return true;
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(u);
        return Boolean(
          user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin
        );
      } catch {
        return false;
      }
    }

    if (!bypassAuth && !(await isAdmin(userId))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      structured?: string;
      data?: any;
      hidden?: boolean;
      forceHidden?: boolean;
      uploadedBy: string;
    };

    const payload = body?.data ?? body?.structured;
    const input =
      typeof payload === "string" ? JSON.parse(payload) : (payload as unknown);

    if (!input || !Array.isArray((input as any)?.elections)) {
      return new Response("Invalid input: missing elections array", {
        status: 400,
      });
    }

    const result = await seedStructuredData({
      data: input as any,
      uploadedBy: String(body?.uploadedBy || "<unknown>"),
      hiddenOverride: body?.hidden,
      forceHidden: body?.forceHidden,
    });

    return Response.json({
      success: true,
      results: result.results,
      hidden: result.hidden,
      message: result.hidden
        ? "Election(s) and candidates created as hidden."
        : "Election(s) created (visible).",
    });
  } catch (err: any) {
    console.error("/api/admin/seed-structured error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
