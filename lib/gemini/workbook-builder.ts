import type { InsertResultItem } from "@/election-source/build-spreadsheet";
import type { UploadElectionBatch } from "@prisma/client";
import { getRawValue } from "@/election-source/helpers";
import { prisma } from "@/lib/prisma";

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

async function buildEmailToLinkMap(
  insertResults: InsertResultItem[],
  allEmails: string[],
  origin: string
) {
  const map = new Map<string, string>();
  
  // First, add newly inserted candidates from insertResults
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
  
  // Then, look up any remaining emails in the database for pre-existing candidates
  const normalizedEmails = allEmails
    .map(e => norm(e))
    .filter(e => e && !map.has(e)); // Only query emails not already in map
  
  if (normalizedEmails.length > 0) {
    const existingCandidates = await prisma.candidate.findMany({
      where: {
        email: {
          in: normalizedEmails,
          mode: 'insensitive'
        }
      },
      select: {
        email: true,
        slug: true
      }
    });
    
    existingCandidates.forEach((candidate) => {
      const normalized = norm(candidate.email || undefined);
      if (normalized && candidate.slug) {
        map.set(normalized, `${origin}/candidate/${candidate.slug}`);
      }
    });
  }
  
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
  
  // Normalize email for lookup - handle both lowercase (from new uploads) 
  // and mixed case (from legacy data or database storage)
  const emailNormalized = norm(emailOriginal);
  const candidateLink = emailNormalized
    ? emailToLink.get(emailNormalized) ?? ""
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

async function buildWorkbookMatrix({
  rawRows,
  insertResults,
  baseUrl,
}: {
  rawRows: RawRow[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Promise<Array<(string | number)[]>> {
  const origin = baseUrl?.replace(/\/$/, "") || BASE_ORIGIN;
  
  // Extract all emails from raw rows
  const allEmails = rawRows.map((row) => {
    const emailRaw = extractField(row, ["email", "Email"]);
    return getString(emailRaw);
  }).filter(e => e);
  
  const emailToLink = await buildEmailToLinkMap(insertResults, allEmails, origin);
  const rows = rawRows.map((row) => buildRow(row, emailToLink));
  return [HEADERS, ...rows];
}

export async function buildWorkbookMatrixFromBatches({
  batches,
  insertResults,
  baseUrl,
}: {
  batches: UploadElectionBatch[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Promise<Array<(string | number)[]>> {
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
  return await buildWorkbookMatrix({ rawRows, insertResults, baseUrl });
}

export async function buildWorkbookMatrixFromRows({
  rows,
  insertResults,
  baseUrl,
}: {
  rows: RawRow[];
  insertResults: InsertResultItem[];
  baseUrl?: string;
}): Promise<Array<(string | number)[]>> {
  return await buildWorkbookMatrix({ rawRows: rows, insertResults, baseUrl });
}
