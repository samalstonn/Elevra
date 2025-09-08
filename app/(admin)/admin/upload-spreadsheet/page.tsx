"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";

type Row = {
  municipality?: string;
  state?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  year?: string | number;
  email?: string;
};

const REQUIRED_HEADERS = [
  "municipality",
  "state",
  "firstName",
  "lastName",
  "position",
  "year",
  "email",
] as const;

export default function UploadSpreadsheetPage() {
  usePageTitle("Admin – Upload Spreadsheet");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<Row[]>([]);
  const [geminiOutput, setGeminiOutput] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [structuredOutput, setStructuredOutput] = useState<string>("");
  const [sendingStructured, setSendingStructured] = useState(false);
  const [dbPlan, setDbPlan] = useState<string>("");
  // Badge state sourced from server status so only one env is needed
  const [mockMode, setMockMode] = useState(false);
  const [modelName, setModelName] = useState<string>("");
  // Collapsible sections (start collapsed)
  const [showGeminiOutput, setShowGeminiOutput] = useState(false);
  const [showStructuredOutput, setShowStructuredOutput] = useState(false);
  const [showDbPlan, setShowDbPlan] = useState(false);
  const [showInsertResult, setShowInsertResult] = useState(false);
  const [rawRows, setRawRows] = useState<Array<Record<string, unknown>>>([]);
  const [, setOriginalExt] = useState<string>(""); // reserved for future format-specific export
  const initialDbMock =
    (process.env.NEXT_PUBLIC_DB_MOCK || "").toLowerCase() === "true";
  const [dbMockMode] = useState<boolean>(initialDbMock);
  // Load Gemini status on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/gemini/status", { cache: "no-store" });
        if (!res.ok) return;
        const data: { geminiEnabled?: boolean; model?: string } | null =
          await res.json().catch(() => null);
        if (data && alive) {
          setMockMode(!Boolean(data.geminiEnabled));
          setModelName(data.model || "");
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const [inserting, setInserting] = useState(false);
  const [insertResult, setInsertResult] = useState<string>("");
  const [goingLive, setGoingLive] = useState(false);
  const isProd = process.env.NODE_ENV === "production";

  function normalizeHeader(h: string): string {
    return h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  function mapHeaders<T extends Record<string, unknown>>(obj: T): Row {
    const mapped: Row = {};
    for (const key of Object.keys(obj)) {
      const norm = normalizeHeader(key);
      const val = (obj as Record<string, unknown>)[key];
      const asStr = (v: unknown): string =>
        typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
      // Try to map common variations to our required names
      switch (norm) {
        case "municipality":
        case "city":
        case "town":
        case "village":
          mapped.municipality = asStr(val);
          break;
        case "state":
          mapped.state = asStr(val);
          break;
        case "firstname":
        case "first":
        case "givenname":
          mapped.firstName = asStr(val);
          break;
        case "lastname":
        case "last":
        case "surname":
          mapped.lastName = asStr(val);
          break;
        case "position":
        case "title":
        case "role":
          mapped.position = asStr(val);
          break;
        case "year":
          if (typeof val === "number" || typeof val === "string") mapped.year = val;
          break;
        case "email":
        case "emailaddress":
          mapped.email = asStr(val);
          break;
        default:
          break;
      }
    }
    return mapped;
  }

  function hasRequiredHeaders(sample: Row): boolean {
    return REQUIRED_HEADERS.every((h) => sample[h as keyof Row] !== undefined);
  }

  async function handleFile(file: File) {
    setError("");
    setStatus("Parsing file…");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        const text = await file.text();
        const Papa = (await import("papaparse")).default;
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim(),
        });
        if (parsed.errors?.length) {
          console.warn("CSV parse warnings:", parsed.errors);
        }
        const rows = (parsed.data as Record<string, unknown>[]) || [];
        setRawRows(rows);
        setOriginalExt("csv");
        await processRows(rows, file.name);
      } else if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        });
        setRawRows(rows);
        setOriginalExt(ext);
        await processRows(rows, file.name);
      } else {
        setError("Unsupported file type. Please upload a CSV or Excel file.");
        setStatus("");
      }
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to parse file. See console for details.");
      setStatus("");
    }
  }

  async function processRows(
    rows: Array<Record<string, unknown>>,
    fileName: string
  ) {
    const mapped = rows.map(mapHeaders).filter((r) => Object.keys(r).length);
    if (!mapped.length) {
      setError("No rows found in the file.");
      setStatus("");
      return;
    }
    if (!hasRequiredHeaders(mapped[0])) {
      setError(
        "Missing required headers. Expected: municipality, state, firstName, lastName, position, year, email"
      );
      setStatus("");
      // Still log what we have for debugging
    }

    const preview = mapped.slice(0, 5);
    console.log(`[Upload Preview] ${fileName}: first ${preview.length} rows`);
    console.table(preview);
    setStatus(`Parsed ${mapped.length} rows. Check console for preview.`);
    setParsedRows(mapped);
  }

  async function sendToGemini() {
    setSending(true);
    setGeminiOutput("");
    setError("");
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Gemini request failed (${res.status})`);
      }
      const isMock = res.headers.get("x-gemini-mock") === "1";
      const model = res.headers.get("x-gemini-model") || "";
      setMockMode(isMock);
      setModelName(model);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buf += chunk;
        setGeminiOutput((prev) => prev + chunk);
      }
      // Final flush
      setGeminiOutput(buf);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to call Gemini API");
    } finally {
      setSending(false);
    }
  }

  async function sendToGeminiStructured() {
    setSendingStructured(true);
    setError("");
    setStructuredOutput("");
    try {
      const res = await fetch("/api/gemini/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousOutput: geminiOutput,
          originalRows: parsedRows,
        }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          txt || `Gemini structured request failed (${res.status})`
        );
      }
      const isMock = res.headers.get("x-gemini-mock") === "1";
      const model = res.headers.get("x-gemini-model") || modelName;
      setMockMode(isMock || mockMode);
      setModelName(model);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buf += chunk;
        setStructuredOutput((prev) => prev + chunk);
      }
      // Pretty print if possible
      try {
        const obj = JSON.parse(buf);
        setStructuredOutput(JSON.stringify(obj, null, 2));
      } catch {
        // leave as is
      }
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Failed to call Gemini (structured)"
      );
    } finally {
      setSendingStructured(false);
    }
  }

  // Production one-click flow
  async function goLive() {
    if (!parsedRows.length) {
      setError("Please upload a spreadsheet first.");
      return;
    }
    setGoingLive(true);
    setError("");
    setInsertResult("");
    try {
      // 1) Analyze with Gemini
      const analyzeRes = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });
      if (!analyzeRes.ok || !analyzeRes.body) {
        const txt = await analyzeRes.text().catch(() => "");
        throw new Error(txt || `Gemini request failed (${analyzeRes.status})`);
      }
      const isMock = analyzeRes.headers.get("x-gemini-mock") === "1";
      const model = analyzeRes.headers.get("x-gemini-model") || "";
      setMockMode(isMock);
      setModelName(model);
      {
        const reader = analyzeRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
        }
        const analysisText = buf;
        setGeminiOutput(analysisText);
        // 2) Run structured output using the fresh local analysis text (avoid stale state)
        let structured = "";
        const structRes = await fetch("/api/gemini/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previousOutput: analysisText, originalRows: parsedRows }),
        });
        if (!structRes.ok || !structRes.body) {
          const txt = await structRes.text().catch(() => "");
          throw new Error(txt || `Gemini structured request failed (${structRes.status})`);
        }
        const sReader = structRes.body.getReader();
        const sDecoder = new TextDecoder();
        let sBuf = "";
        while (true) {
          const { done, value } = await sReader.read();
          if (done) break;
          sBuf += sDecoder.decode(value, { stream: true });
        }
        try {
          const obj = JSON.parse(sBuf);
          structured = JSON.stringify(obj, null, 2);
        } catch {
          structured = sBuf;
        }
        setStructuredOutput(structured);

        // 3) Insert into DB
        const insertRes = await fetch("/api/admin/seed-structured", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ structured }),
        });
        const text = await insertRes.text();
        if (!insertRes.ok) throw new Error(text || `Insert failed (${insertRes.status})`);
        try {
          const obj = JSON.parse(text) as {
            results?: Array<{
              candidateSlugs?: string[];
              city?: string;
              state?: string;
              electionId?: number;
              [k: string]: unknown;
            }>;
            [k: string]: unknown;
          };
          const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
          if (obj?.results) {
            for (const r of obj.results) {
              r.candidateUrls = (r.candidateSlugs || []).map((s: string) => `${base}/candidate/${s}`);
              if (r.city && r.state && r.electionId) {
                r.electionResultsUrl = `${base}/results?city=${encodeURIComponent(r.city as string)}&state=${encodeURIComponent(r.state as string)}&electionID=${r.electionId as number}`;
              }
            }
          }
          setInsertResult(JSON.stringify(obj, null, 2));
          await buildAndDownloadResultSheet(obj, structured);
        } catch {
          setInsertResult(text);
        }
        return; // early return since we've completed the rest of the flow
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Go Live failed");
    } finally {
      setGoingLive(false);
    }
  }

  // --- Dry-run DB plan builder ---
  type StructuredCandidate = {
    name: string;
    currentRole?: string | null;
    party?: string | null;
    image_url?: string | null;
    linkedin_url?: string | null;
    campaign_website_url?: string | null;
    bio?: string | null;
    key_policies?: string[] | null;
    home_city?: string | null;
    hometown_state?: string | null;
    additional_notes?: string | null;
    sources?: string[] | null;
    email?: string | null;
  };
  type StructuredElection = {
    election: {
      title: string;
      type: "LOCAL" | "UNIVERSITY" | "STATE";
      date: string; // MM/DD/YYYY
      city: string;
      state: string;
      number_of_seats?: string | null;
      description: string;
    };
    candidates: StructuredCandidate[];
  };

  // Types for the dry-run plan preview/export
  type ElectionCreatePlan = {
    position: string;
    date: string | null;
    city: string;
    state: string;
    description: string;
    positions: number;
    type: "LOCAL" | "UNIVERSITY" | "STATE";
  };
  type CandidateUpsertPlan = {
    slugDraft: string;
    upsert: {
      where: { slug: string };
      update: {
        currentRole: string | null;
        website: string | null;
        linkedin: string | null;
        bio: string;
        currentCity: string | null;
        currentState: string | null;
        status: "APPROVED";
        verified: boolean;
      };
      create: {
        name: string;
        slug: string;
        currentRole: string | null;
        website: string | null;
        linkedin: string | null;
        bio: string;
        currentCity: string | null;
        currentState: string | null;
        status: "APPROVED";
        verified: boolean;
        email: string | null;
      };
    };
    electionLinkCreate: {
      party: string;
      policies: string[];
      sources: string[];
      additionalNotes: string | null;
    };
  };

  function slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, "-")
      .trim();
  }
  // Read a value from a raw row by matching any header variant (case/spacing-insensitive)
  function getRawValue(raw: Record<string, unknown>, variants: string[]): string {
    const want = new Set(variants.map((v) => normalizeHeader(v)));
    for (const k of Object.keys(raw)) {
      if (want.has(normalizeHeader(k))) {
        const v = raw[k];
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
      }
    }
    return "";
  }
  function ensureUniqueSlugs(names: string[]): string[] {
    const result: string[] = [];
    const used = new Map<string, number>();
    for (const n of names) {
      const base = slugify(n || "");
      const count = used.get(base) ?? 0;
      if (count === 0) {
        result.push(base);
        used.set(base, 1);
      } else {
        const next = `${base}-${count + 1}`;
        result.push(next);
        used.set(base, count + 1);
      }
    }
    return result;
  }
  function parseDateMMDDYYYY(s: string): string | null {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s?.trim?.() || "");
    if (!m) return null;
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`; // ISO-like date string
  }
  function parseSeats(s?: string | null): number | null {
    if (!s) return null;
    const m = /\d+/.exec(s);
    return m ? parseInt(m[0], 10) : null;
  }

  async function buildDbDryRun() {
    setDbPlan("");
    setError("");
    try {
      const data = JSON.parse(structuredOutput || "null");
      if (!data || !Array.isArray(data.elections)) {
        throw new Error("Structured output is missing 'elections' array");
      }
      const plan: { elections: Array<{ electionCreate: ElectionCreatePlan; candidates: CandidateUpsertPlan[] }> } = {
        elections: [],
      };
      for (const item of data.elections as StructuredElection[]) {
        const e = item.election;
        const dateISO = parseDateMMDDYYYY(e.date);
        const seats = parseSeats(e.number_of_seats ?? undefined);
        const electionCreate = {
          // mirrors body for POST /api/submit/election used in seed.ts
          position: e.title,
          date: dateISO, // would convert to Date on server
          city: e.city,
          state: e.state,
          description: e.description,
          positions: seats ?? 1,
          type: e.type,
        };

        const names = (item.candidates || []).map((c) => c.name || "");
        const slugs = ensureUniqueSlugs(names);

        const candidatesPlan = (item.candidates || []).map((c, idx) => {
          const slugDraft = slugs[idx];
          const upsert = {
            where: { slug: slugDraft },
            update: {
              currentRole: c.currentRole ?? null,
              website:
                c.campaign_website_url && c.campaign_website_url !== "N/A"
                  ? c.campaign_website_url
                  : null,
              linkedin:
                c.linkedin_url && c.linkedin_url !== "N/A"
                  ? c.linkedin_url
                  : null,
              bio: c.bio ?? "",
              currentCity: c.home_city ?? null,
              currentState: c.hometown_state ?? null,
              status: "APPROVED" as const,
              verified: false,
            },
            create: {
              name: c.name,
              slug: slugDraft,
              currentRole: c.currentRole ?? null,
              website:
                c.campaign_website_url && c.campaign_website_url !== "N/A"
                  ? c.campaign_website_url
                  : null,
              linkedin:
                c.linkedin_url && c.linkedin_url !== "N/A"
                  ? c.linkedin_url
                  : null,
              bio: c.bio ?? "",
              currentCity: c.home_city ?? null,
              currentState: c.hometown_state ?? null,
              status: "APPROVED" as const,
              verified: false,
              email: c.email ?? null,
            },
          };
          const electionLinkCreate = {
            party: c.party ?? "",
            policies: c.key_policies ?? [],
            sources: c.sources ?? [],
            additionalNotes: c.additional_notes ?? null,
          };
          return { slugDraft, upsert, electionLinkCreate };
        });

        plan.elections.push({ electionCreate, candidates: candidatesPlan });
      }
      const planJson = JSON.stringify(plan, null, 2);
      setDbPlan(planJson);
      // Also build a preview spreadsheet with planned links
      await buildAndDownloadPreviewSheet(plan);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to build DB dry run plan");
    }
  }

  // Build a spreadsheet using the dry-run plan, deriving links using slug drafts and city/state
  async function buildAndDownloadPreviewSheet(plan: {
    elections: Array<{
      electionCreate: ElectionCreatePlan;
      candidates: CandidateUpsertPlan[];
    }>;
  }) {
    try {
      if (!rawRows.length) return;
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const norm = (s?: string | null) => (s || "").trim().toLowerCase();
      const municipalities = new Set<string>();

      const newRows = rawRows.map((raw) => {
        const out: Record<string, unknown> = { ...raw };
        const cityRaw = getRawValue(raw as Record<string, unknown>, [
          "municipality",
          "city",
          "town",
          "village",
        ]);
        const stateRaw = getRawValue(raw as Record<string, unknown>, [
          "state",
        ]);
        const first = getRawValue(raw as Record<string, unknown>, [
          "firstName",
          "First Name",
          "firstname",
          "first",
          "givenname",
        ]).trim();
        const last = getRawValue(raw as Record<string, unknown>, [
          "lastName",
          "Last Name",
          "lastname",
          "last",
          "surname",
        ]).trim();
        const city = norm(String(cityRaw));
        const state = norm(String(stateRaw));
        if (String(cityRaw)) municipalities.add(String(cityRaw));

        const planned = plan.elections.find(
          (e) => norm(e.electionCreate.city) === city && norm(e.electionCreate.state) === state
        );

        if (planned) {
          // Planned results page link (no ID yet): city/state filter
          out["election_link"] = `${base}/results?city=${encodeURIComponent(
            planned.electionCreate.city
          )}&state=${encodeURIComponent(planned.electionCreate.state)}`;
          // Derive slug and generate candidate URL if present in planned candidates
          const derivedSlug = slugify(`${first} ${last}`.trim());
          const match = planned.candidates.find((c) => c.slugDraft === derivedSlug);
          out["candidate_link"] = match ? `${base}/candidate/${match.slugDraft}` : "";
        } else {
          out["election_link"] = "";
          out["candidate_link"] = "";
        }
        return out;
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(newRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Preview");
      const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const cities = Array.from(municipalities).filter(Boolean);
      const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      const cityPart = cities.length ? safe(cities.join("_")) : "upload";
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
      const fname = `elevra-preview-${cityPart}-${stamp}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build/download preview sheet", err);
    }
  }

  // Build and download a spreadsheet with election_link and candidate_link columns
  async function buildAndDownloadResultSheet(
    insertObj: {
      results?: Array<{
        city?: string;
        state?: string;
        electionId?: number;
        electionResultsUrl?: string;
        candidateSlugs?: string[];
        candidateUrls?: string[];
      }>;
    },
    structuredJsonText?: string
  ) {
    try {
      if (!rawRows.length) return;
      type StructuredJson = {
        elections: Array<{
          election: { city: string; state: string };
          candidates: Array<{ name: string; email?: string | null }>;
        }>;
      };
      let structured: StructuredJson | null = null;
      try {
        const t = structuredJsonText || structuredOutput;
        structured = t ? (JSON.parse(t) as StructuredJson) : null;
      } catch {
        structured = null;
      }

      const results = insertObj.results || [];
      const norm = (s?: string | null) => (s || "").trim().toLowerCase();
      const municipalities = new Set<string>();
      const electionMaps = results.map((r, idx) => {
        const candidateUrls = (r.candidateUrls || []) as string[];
        const candidateSlugs = (r.candidateSlugs || []) as string[];
        const nameToUrl = new Map<string, string>();
        const emailToUrl = new Map<string, string>();
        const slugToUrl = new Map<string, string>();
        const se = structured?.elections?.[idx];
        if (se) {
          se.candidates.forEach((c, i) => {
            const url = candidateUrls[i] || "";
            if (c.name) nameToUrl.set(norm(c.name), url);
            if (c.email) emailToUrl.set(norm(c.email), url);
          });
        }
        candidateSlugs.forEach((slug, i) => {
          const url = candidateUrls[i] || "";
          slugToUrl.set(norm(slug), url);
        });
        return {
          city: r.city || se?.election?.city || "",
          state: r.state || se?.election?.state || "",
          resultsUrl: r.electionResultsUrl || "",
          nameToUrl,
          emailToUrl,
          slugToUrl,
          candidateUrls,
        };
      });

      const newRows = rawRows.map((raw) => {
        const out: Record<string, unknown> = { ...raw };
        const cityRaw = getRawValue(raw as Record<string, unknown>, [
          "municipality",
          "city",
          "town",
          "village",
        ]);
        const stateRaw = getRawValue(raw as Record<string, unknown>, [
          "state",
        ]);
        const first = getRawValue(raw as Record<string, unknown>, [
          "firstName",
          "First Name",
          "firstname",
          "first",
          "givenname",
        ]).trim();
        const last = getRawValue(raw as Record<string, unknown>, [
          "lastName",
          "Last Name",
          "lastname",
          "last",
          "surname",
        ]).trim();
        const email = norm(
          getRawValue(raw as Record<string, unknown>, [
            "email",
            "Email",
            "emailaddress",
          ])
        );
        const city = norm(String(cityRaw));
        const state = norm(String(stateRaw));
        if (String(cityRaw)) municipalities.add(String(cityRaw));

        let em = electionMaps.find((m) => norm(m.city) === city && norm(m.state) === state);
        if (!em && city) em = electionMaps.find((m) => norm(m.city) === city);

        let candidateLink = "";
        if (em) {
          const fullName = norm(`${first} ${last}`.trim());
          // Try email first
          if (email && em.emailToUrl.has(email)) {
            candidateLink = em.emailToUrl.get(email) || "";
          } else if (fullName && em.nameToUrl.has(fullName)) {
            // Then by structured name mapping
            candidateLink = em.nameToUrl.get(fullName) || "";
          }
          if (!candidateLink) {
            // Fallback: derive slug from first/last and match to slugs
            const derivedSlug = slugify(`${first} ${last}`.trim());
            const urlBySlug = em.slugToUrl.get(norm(derivedSlug));
            if (urlBySlug) candidateLink = urlBySlug;
          }
          if (!candidateLink && em.candidateUrls.length === 1) {
            // Final fallback: single candidate in this election → assign it
            candidateLink = em.candidateUrls[0] || "";
          }
          out["election_link"] = em.resultsUrl || "";
        } else {
          out["election_link"] = "";
        }
        out["candidate_link"] = candidateLink;
        return out;
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(newRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Results");
      const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const cities = Array.from(municipalities).filter(Boolean);
      const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      const cityPart = cities.length ? safe(cities.join("_")) : "upload";
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
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

  async function insertIntoDb() {
    setInserting(true);
    setInsertResult("");
    setError("");
    try {
      const res = await fetch("/api/admin/seed-structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structured: structuredOutput }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Insert failed (${res.status})`);
      }
      // pretty print if JSON
      try {
        const obj = JSON.parse(text) as {
          results?: Array<{
            candidateSlugs?: string[];
            city?: string;
            state?: string;
            electionId?: number;
            [k: string]: unknown;
          }>;
          [k: string]: unknown;
        };
        const base =
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000";
        // Append candidate URLs for convenience
        if (obj?.results) {
          for (const r of obj.results) {
            r.candidateUrls = (r.candidateSlugs || []).map(
              (s: string) => `${base}/candidate/${s}`
            );
            if (r.city && r.state && r.electionId) {
              r.electionResultsUrl = `${base}/results?city=${encodeURIComponent(
                r.city
              )}&state=${encodeURIComponent(r.state)}&electionID=${
                r.electionId
              }`;
            }
          }
        }
        setInsertResult(JSON.stringify(obj, null, 2));
        await buildAndDownloadResultSheet(obj);
      } catch {
        setInsertResult(text);
      }
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to insert into DB");
    } finally {
      setInserting(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-2">Upload Spreadsheet</h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload a CSV or Excel file with headers: municipality, state, firstName,
        lastName, position, year, email. We will log the first few rows to the
        console for verification.
      </p>

      <div className="space-y-3 bg-white/70 p-4 rounded border">
        <div className="flex gap-2 flex-wrap">
          {mockMode && (
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.591c.75 1.335-.213 2.985-1.742 2.985H3.48c-1.53 0-2.492-1.65-1.743-2.985L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z"
                  clipRule="evenodd"
                />
              </svg>
              Gemini mock mode active (no external calls)
            </span>
          )}
          {dbMockMode && (
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-rose-100 text-rose-800 px-2 py-1 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.5a.75.75 0 011.5 0v1a.75.75 0 01-1.5 0v-1zm0-6a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5z"
                  clipRule="evenodd"
                />
              </svg>
              Prisma DB mock mode active (no writes)
            </span>
          )}
          {modelName && (
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Model: {modelName}
            </span>
          )}
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="block w-full text-sm"
        />
        {status && <p className="text-green-700 text-sm">{status}</p>}
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <div className="pt-2 flex flex-col gap-3">
          {isProd ? (
            <button
              type="button"
              onClick={goLive}
              disabled={!parsedRows.length || goingLive}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50 text-left"
            >
              {goingLive ? "Going Live…" : "Go Live"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={sendToGemini}
                disabled={!parsedRows.length || sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-left"
              >
                {sending ? "Sending to Gemini…" : "Analyze with Gemini"}
              </button>
              <button
                type="button"
                onClick={sendToGeminiStructured}
                disabled={!geminiOutput || sendingStructured}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-left"
              >
                {sendingStructured ? "Structuring…" : "Run Structured Output"}
              </button>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={buildDbDryRun}
                  disabled={!structuredOutput}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                >
                  Preview DB Insert (Dry Run)
                </button>
                <button
                  type="button"
                  onClick={insertIntoDb}
                  disabled={!structuredOutput || inserting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  title="Performs actual Prisma inserts"
                >
                  {inserting ? "Inserting…" : "Insert Into DB (Live)"}
                </button>
                {!!parsedRows.length && (
                  <span className="text-xs text-gray-600 self-center">
                    Rows ready: {parsedRows.length}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {geminiOutput && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowGeminiOutput((v) => !v)}
              className="text-sm font-medium mb-1 underline text-purple-700"
            >
              {showGeminiOutput ? "Hide Gemini Output" : "Show Gemini Output"}
            </button>
            {showGeminiOutput && (
              <textarea
                readOnly
                className="w-full h-64 rounded border px-3 py-2 font-mono text-xs"
                value={geminiOutput}
              />
            )}
          </div>
        )}
        {structuredOutput && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowStructuredOutput((v) => !v)}
              className="text-sm font-medium mb-1 underline text-purple-700"
            >
              {showStructuredOutput
                ? "Hide Structured Output"
                : "Show Structured Output"}
            </button>
            {showStructuredOutput && (
              <textarea
                readOnly
                className="w-full h-80 rounded border px-3 py-2 font-mono text-xs"
                value={structuredOutput}
              />
            )}
          </div>
        )}
        {dbPlan && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDbPlan((v) => !v)}
              className="text-sm font-medium mb-1 underline text-purple-700"
            >
              {showDbPlan ? "Hide DB Dry-Run Plan" : "Show DB Dry-Run Plan"}
            </button>
            {showDbPlan && (
              <textarea
                readOnly
                className="w-full h-96 rounded border px-3 py-2 font-mono text-xs"
                value={dbPlan}
              />
            )}
          </div>
        )}
        {insertResult && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowInsertResult((v) => !v)}
              className="text-sm font-medium mb-1 underline text-purple-700"
            >
              {showInsertResult ? "Hide Insert Result" : "Show Insert Result"}
            </button>
            {showInsertResult && (
              <textarea
                readOnly
                className="w-full h-80 rounded border px-3 py-2 font-mono text-xs"
                value={insertResult}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
