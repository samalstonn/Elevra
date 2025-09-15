// Build and download a spreadsheet with election_link and CandidateLink columns
// Accepts optional rows to use for sheet building (raw) and parsed rows for fallback matching

import { getRawValue } from "@/election-source/helpers";

export type InsertResultItem = {
  city: string;
  state: string;
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
};

export async function buildAndDownloadResultSheet(
  insertObj: {
    results?: InsertResultItem[];
  },
  structuredJsonText: string,
  rowsForSheet: Array<Record<string, unknown>>,
  parsedRowsForSheet: Row[]
) {
  try {
    const sourceRows = rowsForSheet;
    if (!sourceRows.length) return;
    type StructuredJson = {
      elections: Array<{
        election: { city: string; state: string };
        candidates: Array<{ name: string; email?: string | null }>;
      }>;
    };
    let structured: StructuredJson | null = null;
    try {
      const t = structuredJsonText || null;
      structured = t ? (JSON.parse(t) as StructuredJson) : null;
    } catch {
      structured = null;
    }

    const results = insertObj.results || [];
    const norm = (s?: string | null) => (s || "").trim().toLowerCase();
    const municipalities = new Set<string>();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    // Build email-first maps
    const emailToCandidateUrl = new Map<string, string>();
    const emailToResultsUrl = new Map<string, string>();

    for (const r of results) {
      const candidateSlugs = (r.candidateSlugs || []) as string[];
      const candidateUrls = candidateSlugs.map((slug) =>
        slug ? `${base}/candidate/${slug}` : ""
      );
      const resultsUrl =
        r.electionResultsUrl && r.electionResultsUrl.length
          ? r.electionResultsUrl
          : r.city && r.state && r.electionId
          ? `${base}/results?city=${encodeURIComponent(
              r.city
            )}&state=${encodeURIComponent(r.state)}&electionID=${r.electionId}`
          : "";
      if (Array.isArray(r.candidateEmails)) {
        r.candidateEmails.forEach((eml: string | null, i: number) => {
          const emailNorm = norm(eml);
          if (emailNorm) {
            const url = candidateUrls[i] || "";
            if (url) emailToCandidateUrl.set(emailNorm, url);
            if (resultsUrl) emailToResultsUrl.set(emailNorm, resultsUrl);
          }
        });
      }
    }

    // First pass: set CandidateLink by email, collect group→resultsUrl
    const groupToResultsUrl = new Map<string, string>();
    const interimRows: Array<{
      out: Record<string, unknown>;
      groupKey: string;
    }> = [];

    sourceRows.forEach((raw, idx) => {
      const out: Record<string, unknown> = { ...raw };
      const municipalityRaw = getRawValue(raw as Record<string, unknown>, [
        "municipality",
      ]);
      if (String(municipalityRaw)) municipalities.add(String(municipalityRaw));
      const groupKey = norm(String(municipalityRaw));

      let email = norm(
        getRawValue(raw as Record<string, unknown>, ["email", "Email"])
      );
      if (!email && parsedRowsForSheet?.[idx]?.email) {
        email = norm(parsedRowsForSheet[idx].email);
      }

      let candidateLink = "";
      if (email && emailToCandidateUrl.has(email)) {
        candidateLink = emailToCandidateUrl.get(email) || "";
        const ru = emailToResultsUrl.get(email) || "";
        if (ru) groupToResultsUrl.set(groupKey, ru);
      }

      out["CandidateLink"] = candidateLink;
      // election_link is set in second pass
      interimRows.push({ out, groupKey });
    });

    // Second pass: set election_link for all rows in a group
    const newRows = interimRows.map(({ out, groupKey }) => {
      out["election_link"] = groupToResultsUrl.get(groupKey) || "";
      return out;
    });

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(newRows);
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
