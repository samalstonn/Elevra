import { getRawValue } from "@/election-source/helpers";
import { buildWorkbookMatrixFromRows } from "@/lib/gemini/workbook-builder";

export type InsertResultItem = {
  city: string;
  state: string;
  position: string;
  electionId: number;
  electionResultsUrl: string;
  candidateSlugs: string[];
  candidateEmails: (string | null)[];
  hidden: boolean;
};

export type Row = {
  municipality: string;
  state: string;
  firstName: string;
  lastName: string;
  position: string;
  year: string | number;
  email: string;
  name?: string;
  districtType?: string;
  district?: string;
  raceLabel?: string;
  termType?: string;
  termLength?: string;
  mailingAddress?: string;
  phone?: string;
  filingDate?: string;
  partyPreference?: string;
  status?: string;
};

export async function buildAndDownloadResultSheet(
  insertObj: {
    results?: InsertResultItem[];
  },
  _structuredJsonText: string,
  rowsForSheet: Array<Record<string, unknown>>,
  _parsedRowsForSheet: Row[]
) {
  try {
    if (!rowsForSheet.length) return;

    const municipalities = new Set<string>();
    rowsForSheet.forEach((row) => {
      const municipality = getRawValue(row, ["municipality", "Municipality"]);
      if (municipality) {
        municipalities.add(String(municipality));
      }
    });

    const matrix = buildWorkbookMatrixFromRows({
      rows: rowsForSheet,
      insertResults: insertObj.results || [],
      baseUrl:
        typeof window !== "undefined" ? window.location.origin : undefined,
    });

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([ab], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const cities = Array.from(municipalities).filter(Boolean);
    const safe = (s: string) =>
      s
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
    const cityPart = cities.length ? safe(cities.join("_")) : "upload";
    const ts = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(
      ts.getDate()
    )}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
    const fname = `elevra-${cityPart}-${stamp}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to build/download result sheet", err);
  }
}
