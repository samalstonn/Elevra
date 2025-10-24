import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import type { InsertResultItem } from "@/election-source/build-spreadsheet";
import { buildWorkbookMatrixFromBatches } from "./workbook-builder";

export type WorkbookBuildResult = {
  filename: string;
  buffer: Buffer;
  summary: Record<string, unknown>;
};

export async function buildWorkbookForUpload(uploadId: string): Promise<WorkbookBuildResult> {
  const upload = await prisma.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    include: {
      batches: true,
    },
  });
  if (!upload) {
    throw new Error(`Spreadsheet upload ${uploadId} not found`);
  }

  const summary = toSummaryObject(upload.summaryJson);
  const insertResults = Array.isArray(summary.insertResults)
    ? (summary.insertResults as InsertResultItem[])
    : [];

  const matrix = buildWorkbookMatrixFromBatches({
    batches: upload.batches,
    insertResults,
  });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  XLSX.utils.book_append_sheet(workbook, sheet, "Results");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return {
    filename: `elevra-upload-${upload.id}.xlsx`,
    buffer,
    summary,
  };
}

function toSummaryObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
