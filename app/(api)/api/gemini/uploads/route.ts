import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { createSpreadsheetUpload } from "@/lib/gemini/queue";
import { reportGeminiError } from "@/lib/gemini/logger";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import type { Row } from "@/election-source/build-spreadsheet";

type UploadRequestPayload = {
  rows?: Row[];
  originalFilename?: string;
  uploaderEmail?: string;
  summary?: Record<string, unknown> | null;
  forceHidden?: boolean;
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const filename = params.get("filename")?.trim();
  const uploader = params.get("uploader")?.trim();
  const limitParam = Number.parseInt(params.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 20;

  const where: Prisma.SpreadsheetUploadWhereInput = {};
  if (filename) {
    where.originalFilename = {
      contains: filename,
      mode: "insensitive",
    };
  }
  if (uploader) {
    where.uploaderEmail = {
      contains: uploader,
      mode: "insensitive",
    };
  }

  const uploads = await prisma.spreadsheetUpload.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      originalFilename: true,
      uploaderEmail: true,
      queuedAt: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      summaryJson: true,
    },
  });

  return Response.json({
    uploads: uploads.map((upload) => ({
      id: upload.id,
      status: upload.status,
      originalFilename: upload.originalFilename,
      uploaderEmail: upload.uploaderEmail,
      queuedAt: upload.queuedAt.toISOString(),
      createdAt: upload.createdAt.toISOString(),
      startedAt: upload.startedAt?.toISOString() ?? null,
      completedAt: upload.completedAt?.toISOString() ?? null,
      summary: upload.summaryJson ?? null,
    })),
  });
}

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
    reportGeminiError(error, {
      message: "[gemini/uploads] failed to queue upload",
      tags: { component: "api-route", route: "uploads" },
      extra: {
        originalFilename: body?.originalFilename,
        rowCount: body?.rows?.length ?? 0,
      },
      fingerprint: ["gemini", "api", "uploads"],
    });
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
