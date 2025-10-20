import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import type { InsertResultItem } from "@/election-source/build-spreadsheet";

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

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Upload ID", upload.id],
    ["Status", upload.status],
    ["Queued At", upload.queuedAt?.toISOString() ?? ""],
    ["Started At", upload.startedAt?.toISOString() ?? ""],
    ["Completed At", upload.completedAt?.toISOString() ?? ""],
    ["Original Filename", upload.originalFilename],
    ["Uploader Email", upload.uploaderEmail],
    ["Force Hidden", upload.forceHidden ? "Yes" : "No"],
    ["Batch Count", upload.batches.length],
    ["Total Rows", summary?.rowCount ?? ""],
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const resultsSheetData: Array<(string | number)[]> = [
    [
      "Election ID",
      "City",
      "State",
      "Position",
      "Hidden",
      "Candidate Slugs",
      "Candidate Emails",
    ],
  ];
  insertResults.forEach((item) => {
    resultsSheetData.push([
      item.electionId,
      item.city,
      item.state,
      item.position || "",
      item.hidden ? "Yes" : "No",
      (item.candidateSlugs || []).join(", "),
      (item.candidateEmails || []).map((c) => c ?? "").join(", "),
    ]);
  });
  const resultsSheet = XLSX.utils.aoa_to_sheet(resultsSheetData);
  XLSX.utils.book_append_sheet(workbook, resultsSheet, "Results");

  const batchesSheetData: Array<(string | number)[]> = [
    [
      "Batch ID",
      "Municipality",
      "State",
      "Position",
      "Status",
      "Rows",
    ],
  ];
  upload.batches.forEach((batch) => {
    const rawRows = Array.isArray(batch.rawRows) ? batch.rawRows : [];
    batchesSheetData.push([
      batch.id,
      batch.municipality ?? "",
      batch.state ?? "",
      batch.position ?? "",
      batch.status,
      rawRows.length,
    ]);
  });
  const batchesSheet = XLSX.utils.aoa_to_sheet(batchesSheetData);
  XLSX.utils.book_append_sheet(workbook, batchesSheet, "Batches");

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
