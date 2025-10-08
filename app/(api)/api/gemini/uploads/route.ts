import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { createSpreadsheetUpload } from "@/lib/gemini/queue";
import type { Row } from "@/election-source/build-spreadsheet";

type UploadRequestPayload = {
  rows?: Row[];
  originalFilename?: string;
  uploaderEmail?: string;
  summary?: Record<string, unknown> | null;
  forceHidden?: boolean;
};

export async function POST(req: NextRequest) {
  let body: UploadRequestPayload | null = null;
  try {
    const { userId } = await auth();
    const flags = await requireAdminOrSubAdmin(userId);
    if (!flags) {
      return new Response("Unauthorized", { status: 401 });
    }

    body = (await req.json()) as UploadRequestPayload;

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return Response.json(
        { error: "Missing spreadsheet rows" },
        { status: 400 }
      );
    }
    if (!body.originalFilename) {
      return Response.json(
        { error: "Missing original filename" },
        { status: 400 }
      );
    }
    const uploaderEmail = body.uploaderEmail || "admin@elevra";

    const upload = await createSpreadsheetUpload({
      rows: body.rows,
      originalFilename: body.originalFilename,
      uploaderEmail,
      summary: body.summary,
      forceHidden: body.forceHidden,
    });

    return Response.json({
      uploadId: upload.id,
      status: upload.status,
      summary: upload.summaryJson,
      batchCount: upload.batches.length,
    });
  } catch (error: unknown) {
    console.error(
      "[gemini/uploads] failed to queue upload",
      {
        error,
        originalFilename: body?.originalFilename,
        rowCount: body?.rows?.length ?? 0,
      }
    );
    const message =
      error instanceof Error ? error.message : "Unknown error queuing upload";
    return Response.json(
      {
        error: "Failed to queue upload",
        details: message,
      },
      { status: 500 }
    );
  }
}
