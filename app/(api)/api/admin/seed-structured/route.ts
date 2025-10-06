/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  ingestStructuredPayload,
  type StructuredInput,
} from "@/lib/admin/structured-ingest";

export async function POST(req: NextRequest) {
  try {
    // Authorization: allow E2E header secret or fallback to admin check
    const headerSecret =
      req.headers.get("x-e2e-seed-secret") || req.headers.get("x-seed-secret");
    const envSecret = process.env.E2E_SEED_SECRET || "";
    const bypassAuth = Boolean(
      headerSecret && envSecret && headerSecret === envSecret
    );

    const { userId } = await auth();
    async function isAdmin(u: string | null): Promise<boolean> {
      if (!u) return false;
      // Allow env-based admin list (e.g., ADMIN_USER_IDS="user_abc user_def")
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
      data?: StructuredInput;
      hidden?: boolean;
      forceHidden?: boolean;
      uploadedBy: string;
    };
    const payload = body?.data ?? body?.structured;
    let input: StructuredInput | null = null;
    if (typeof payload === "string") {
      input = JSON.parse(payload) as StructuredInput;
    } else {
      input = payload as StructuredInput | null;
    }
    if (!input || !Array.isArray(input.elections)) {
      return new Response("Invalid input: missing elections array", {
        status: 400,
      });
    }

    const hiddenInProd = process.env.NODE_ENV === "production";
    const forceHidden = Boolean(body?.hidden ?? body?.forceHidden);
    const hiddenFlag = forceHidden || hiddenInProd;
    const uploadedBy = String(body?.uploadedBy || "<unknown>");

    let results;
    try {
      results = await ingestStructuredPayload({
        input,
        hiddenFlag,
        uploadedBy,
      });
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Failed to ingest structured data";
      return new Response(message, { status: 400 });
    }

    return Response.json({
      success: true,
      results,
      message: hiddenFlag
        ? "Election(s) and candidates created as hidden. Uploaded by: " +
          uploadedBy
        : "Election(s) created (visible). Uploaded by: " + uploadedBy,
    });
  } catch (err: any) {
    console.error("/api/admin/seed-structured error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
