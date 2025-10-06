import { Row } from "@/election-source/build-spreadsheet";
import { normalizeHeader } from "@/election-source/helpers";

export const REQUIRED_HEADERS = [
  "municipality",
  "state",
  "firstName",
  "lastName",
  "position",
  "year",
  "email",
] as const;

export type StepStatus = "pending" | "in_progress" | "completed" | "error";

export type Step = {
  key: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

export type BatchJobSnapshot = {
  id: number;
  status: string;
  displayName: string | null;
  uploaderEmail: string;
  analyzeJobName: string | null;
  analyzeMode: string | null;
  analyzeModel: string | null;
  analyzeFallbackUsed: boolean;
  analyzeSubmittedAt: string | null;
  analyzeCompletedAt: string | null;
  analyzeError: string | null;
  structureJobName: string | null;
  structureMode: string | null;
  structureModel: string | null;
  structureFallbackUsed: boolean;
  structureSubmittedAt: string | null;
  structureCompletedAt: string | null;
  structureError: string | null;
  ingestRequestedAt: string | null;
  ingestCompletedAt: string | null;
  ingestError: string | null;
  ingestEmailSentAt: string | null;
  analyzeEmailSentAt: string | null;
  estimatedTokens: number | null;
  totalRows: number;
  groupCount: number;
  forceHidden: boolean;
  notes: string | null;
};

export type BatchGroupSnapshot = {
  id: number;
  jobId: number;
  key: string;
  order: number;
  municipality: string | null;
  state: string | null;
  position: string | null;
  rowCount: number;
  analyzeText: string | null;
  analyzeError: string | null;
  structureText: string | null;
  structureError: string | null;
  structured: unknown;
  status: string;
};

export type StructuredBatchPayload = {
  elections?: Array<Record<string, unknown>>;
};

export type GroupedRowSet = {
  key: string;
  municipality: string;
  state: string;
  position: string;
  rows: Row[];
};

const GROUP_KEY_SEPARATOR = "|";

function normalizeGroupKeyFromRow(row: Row): string {
  const city = (row.municipality || "").trim().toLowerCase();
  const state = (row.state || "").trim().toLowerCase();
  const position = String(row.position ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const sanitizedPosition = position || "unknown-position";
  return [city, state, sanitizedPosition].join(GROUP_KEY_SEPARATOR);
}

export function groupRowsByMunicipalityAndPosition(rows: Row[]): GroupedRowSet[] {
  const map = new Map<string, GroupedRowSet>();

  rows.forEach((row) => {
    const key = normalizeGroupKeyFromRow(row);
    if (!map.has(key)) {
      map.set(key, {
        key,
        municipality: (row.municipality || "").trim(),
        state: (row.state || "").trim(),
        position: String(row.position ?? "").trim(),
        rows: [],
      });
    }
    map.get(key)!.rows.push(row);
  });

  return Array.from(map.values()).sort((a, b) => {
    const stateCompare = (a.state || "").localeCompare(b.state || "");
    if (stateCompare !== 0) return stateCompare;
    const municipalityCompare = (a.municipality || "").localeCompare(
      b.municipality || ""
    );
    if (municipalityCompare !== 0) return municipalityCompare;
    return (a.position || "").localeCompare(b.position || "");
  });
}

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

export function mapHeaders<T extends Record<string, unknown>>(obj: T): Row {
  const mapped: Row = {
    municipality: "",
    state: "",
    firstName: "",
    lastName: "",
    position: "",
    year: "",
    email: "",
    name: "",
    districtType: "",
    district: "",
    raceLabel: "",
    termType: "",
    termLength: "",
    mailingAddress: "",
    phone: "",
    filingDate: "",
    partyPreference: "",
    status: "",
  };

  for (const key of Object.keys(obj)) {
    const normalized = normalizeHeader(key);
    const value = (obj as Record<string, unknown>)[key];

    switch (normalized) {
      case "municipality":
        mapped.municipality = asString(value);
        break;
      case "state":
        mapped.state = asString(value);
        break;
      case "firstName":
      case "firstname":
        mapped.firstName = asString(value);
        break;
      case "lastName":
      case "lastname":
        mapped.lastName = asString(value);
        break;
      case "position":
      case "office":
      case "race":
        mapped.position = asString(value);
        break;
      case "districtType":
      case "districttype":
        mapped.districtType = asString(value);
        break;
      case "district":
        mapped.district = asString(value);
        break;
      case "raceLabel":
      case "racelabel":
        mapped.raceLabel = asString(value);
        break;
      case "termType":
      case "termtype":
        mapped.termType = asString(value);
        break;
      case "termLength":
      case "termlength":
        mapped.termLength = asString(value);
        break;
      case "mailingaddress":
        mapped.mailingAddress = asString(value);
        break;
      case "phone":
        mapped.phone = asString(value);
        break;
      case "filingdate":
        mapped.filingDate = asString(value);
        break;
      case "partypreference":
        mapped.partyPreference = asString(value);
        break;
      case "status":
        mapped.status = asString(value);
        break;
      case "name": {
        const full = asString(value);
        mapped.name = full;
        if (full && (!mapped.firstName || !mapped.lastName)) {
          const parts = full.trim().split(/\s+/);
          if (parts.length === 1) {
            if (!mapped.firstName) mapped.firstName = parts[0];
          } else if (parts.length > 1) {
            if (!mapped.firstName) mapped.firstName = parts[0];
            if (!mapped.lastName) mapped.lastName = parts.slice(1).join(" ");
          }
        }
        break;
      }
      case "year":
        if (typeof value === "number" || typeof value === "string") {
          mapped.year = value;
        }
        break;
      case "email":
        mapped.email = asString(value);
        break;
      default:
        break;
    }
  }

  return mapped;
}

export function hasRequiredHeaders(sample: Row): boolean {
  return REQUIRED_HEADERS.every((header) => sample[header as keyof Row] !== undefined);
}

type ElectionsEnvelope = { elections: unknown[] };

function hasElectionsArray(value: unknown): value is ElectionsEnvelope {
  if (typeof value !== "object" || value === null) return false;
  if (!("elections" in value)) return false;
  const elections = (value as { elections: unknown }).elections;
  return Array.isArray(elections);
}

export function extractElectionsFromJson(text: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (hasElectionsArray(parsed)) return parsed.elections;
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
