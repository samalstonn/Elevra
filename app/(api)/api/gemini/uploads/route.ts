import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { createSpreadsheetUpload } from "@/lib/gemini/queue";
import type { Row } from "@/election-source/build-spreadsheet";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    rows?: Row[];
    originalFilename?: string;
    uploaderEmail?: string;
    summary?: Record<string, unknown> | null;
    forceHidden?: boolean;
  };

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return new Response("Missing spreadsheet rows", { status: 400 });
  }
  if (!body.originalFilename) {
    return new Response("Missing original filename", { status: 400 });
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
}
