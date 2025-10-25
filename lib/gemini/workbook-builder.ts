import type { InsertResultItem } from "@/election-source/build-spreadsheet";
import type { UploadElectionBatch } from "@prisma/client";
import { getRawValue } from "@/election-source/helpers";

const BASE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://www.elevracommunity.com";

const HEADERS: string[] = [
  "",
  "Firstname",
  "",
  "Lastname",
  "",
  "Email",
  "Municipality",
  "state",
  "Position",
  "Year",
  "Candidate Link",
  "Election Link",
];

type RawRow = Record<string, unknown>;

const norm = (value?: string | null) =>
  value ? value.toString().trim().toLowerCase() : "";

const toUpper = (value: unknown) => {
  const str = getString(value);
  return str.toUpperCase();
};

const toTitleCase = (value: unknown) => {
  const str = getString(value).toLowerCase();
  if (!str) return "";
  return str.replace(/\b\w+/g, (word) => {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
};

const getString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getYear = (value: unknown) => {
  const str = getString(value);
  return str;
};

function buildEmailToLinkMap(
  insertResults: InsertResultItem[],
  origin: string
) {
  const map = new Map<string, string>();
  insertResults.forEach((result) => {
    const slugs = Array.isArray(result.candidateSlugs)
      ? result.candidateSlugs
      : [];
    const emails = Array.isArray(result.candidateEmails)
      ? result.candidateEmails
      : [];
    emails.forEach((email, idx) => {
      const normalized = norm(email || undefined);
      if (!normalized) return;
      const slug = slugs[idx];
      if (!slug) return;
      map.set(normalized, `${origin}/candidate/${slug}`);
    });
  });
  return map;
}

function extractField(row: RawRow, keys: string[]): unknown {
  return getRawValue(row, keys);
}

function buildRow(
  row: RawRow,
  emailToLink: Map<string, string>
): Array<string> {
  const firstRaw = extractField(row, [
    "firstName",
    "FirstName",
    "first_name",
    "First Name",
  ]);
  const lastRaw = extractField(row, [
    "lastName",
    "LastName",
    "last_name",
    "Last Name",
  ]);
  const emailRaw = extractField(row, ["email", "Email"]);
  const municipalityRaw = extractField(row, [
    "municipality",
    "Municipality",
  ]);
  const stateRaw = extractField(row, ["state", "State"]);
  const positionRaw = extractField(row, ["position", "Position"]);
  const yearRaw = extractField(row, ["year", "Year"]);

  const emailOriginal = getString(emailRaw);
  const emailUpper = emailOriginal.toUpperCase();
  const candidateLink = emailOriginal
    ? emailToLink.get(norm(emailOriginal)) ?? ""
    : "";

  return [
    toUpper(firstRaw),
    toTitleCase(firstRaw),
    toUpper(lastRaw),
    toTitleCase(lastRaw),
    emailUpper,
    emailOriginal,
    toUpper(municipalityRaw),
    toTitleCase(stateRaw),
    toUpper(positionRaw),
    getYear(yearRaw),
    candidateLink,
    "",
  ];
}

function buildWorkbookMatrix({
  rawRows,
  insertResults,
  baseUrl,
}: {
  rawRows: RawRow[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Array<(string | number)[]> {
  const origin = baseUrl?.replace(/\/$/, "") || BASE_ORIGIN;
  const emailToLink = buildEmailToLinkMap(insertResults, origin);
  const rows = rawRows.map((row) => buildRow(row, emailToLink));
  return [HEADERS, ...rows];
}

export function buildWorkbookMatrixFromBatches({
  batches,
  insertResults,
  baseUrl,
}: {
  batches: UploadElectionBatch[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Array<(string | number)[]> {
  const sortedBatches = [...batches].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
  const rawRows: RawRow[] = [];
  sortedBatches.forEach((batch) => {
    const rows = Array.isArray(batch.rawRows)
      ? (batch.rawRows as RawRow[])
      : [];
    rows.forEach((row) => rawRows.push(row));
  });
  return buildWorkbookMatrix({ rawRows, insertResults, baseUrl });
}

export function buildWorkbookMatrixFromRows({
  rows,
  insertResults,
  baseUrl,
}: {
  rows: RawRow[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Array<(string | number)[]> {
  return buildWorkbookMatrix({ rawRows: rows, insertResults, baseUrl });
}
