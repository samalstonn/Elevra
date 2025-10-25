import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import {
  retryUploadBatch,
  skipUploadBatch,
  getUploadProgress,
} from "@/lib/gemini/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ uploadId: string; batchId: string }> }
) {
  const params = await context.params;
  try {
    const { userId } = await auth();
    const flags = await requireAdminOrSubAdmin(userId);
    if (!flags) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { action, reason } = (await req.json().catch(() => ({}))) as {
      action?: string;
      reason?: string;
    };

    if (!action) {
      return Response.json({ error: "Missing action" }, { status: 400 });
    }

    let upload;
    if (action === "retry") {
      upload = await retryUploadBatch(params.uploadId, params.batchId);
    } else if (action === "skip") {
      upload = await skipUploadBatch(params.uploadId, params.batchId, reason);
    } else if (action === "refresh") {
      upload = await getUploadProgress(params.uploadId);
    } else {
      return Response.json({ error: "Unsupported action" }, { status: 400 });
    }

    if (!upload) {
      return Response.json({ error: "Upload not found" }, { status: 404 });
    }

    return Response.json({ upload });
  } catch (error) {
    console.error("[gemini/uploads/batch] action failed", {
      uploadId: params.uploadId,
      batchId: params.batchId,
      error,
    });
    const message =
      error instanceof Error ? error.message : "Failed to update batch";
    return Response.json({ error: message }, { status: 500 });
  }
}
