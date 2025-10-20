"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import type { Row } from "@/election-source/build-spreadsheet";
import { normalizeHeader, validateEmails } from "@/election-source/helpers";
import { useUser } from "@clerk/nextjs";

const REQUIRED_HEADERS = [
  "municipality",
  "state",
  "firstName",
  "lastName",
  "position",
  "year",
  "email",
] as const;

const TERMINAL_UPLOAD_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "NEEDS_REUPLOAD",
  "CANCELLED",
]);

type UploadAttemptView = {
  id: string;
  status: string;
  modelUsed: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isFallback?: boolean | null;
};

type UploadJobView = {
  id: string;
  type: string;
  status: string;
  retryCount: number;
  lastError?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  attempts: UploadAttemptView[];
};

type UploadBatchView = {
  id: string;
  status: string;
  municipality?: string | null;
  state?: string | null;
  position?: string | null;
  errorReason?: string | null;
  jobs: UploadJobView[];
};

type UploadJobSummary = {
  id: string;
  type: string;
  status: string;
  retryCount: number;
  lastError?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

type UploadStatusView = {
  uploadId: string;
  status: string;
  summary: Record<string, unknown> | null;
  batches: UploadBatchView[];
  jobs: UploadJobSummary[];
};

export default function UploadSpreadsheetPage() {
  usePageTitle("Admin – Upload Spreadsheet");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [batchAction, setBatchAction] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Row[]>([]);
  const [emailValidation, setEmailValidation] = useState<{ ok: boolean; errors: string[] }>({
    ok: true,
    errors: [],
  });
  const [forceHidden, setForceHidden] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [modelName, setModelName] = useState("");
  const [originalFilename, setOriginalFilename] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeUpload, setActiveUpload] = useState<UploadStatusView | null>(null);
  const [pollingError, setPollingError] = useState("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const { isLoaded, isSignedIn, user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const pollUpload = useCallback(
    async (uploadId: string) => {
      try {
        const res = await fetch(`/api/gemini/uploads/${uploadId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed to load upload status (${res.status})`);
        }
        const payload = (await res.json()) as {
          upload: {
            id: string;
            status: string;
            summaryJson: Record<string, unknown> | null;
            batches: Array<{
              id: string;
              status: string;
              municipality?: string | null;
              state?: string | null;
              position?: string | null;
              errorReason?: string | null;
              jobs: Array<{
                id: string;
                type: string;
                status: string;
                retryCount: number;
                lastError?: string | null;
                startedAt?: string | null;
                completedAt?: string | null;
                attempts: UploadAttemptView[];
              }>;
            }>;
            jobs: UploadJobSummary[];
          };
        };

        const mapped: UploadStatusView = {
          uploadId: payload.upload.id,
          status: payload.upload.status,
          summary: payload.upload.summaryJson ?? null,
          batches: payload.upload.batches.map((batch) => ({
            id: batch.id,
            status: batch.status,
            municipality: batch.municipality,
            state: batch.state,
            position: batch.position,
            errorReason: batch.errorReason,
            jobs: batch.jobs.map((job) => ({
              id: job.id,
              type: job.type,
              status: job.status,
              retryCount: job.retryCount,
              lastError: job.lastError,
              startedAt: job.startedAt,
              completedAt: job.completedAt,
              attempts: job.attempts || [],
            })),
          })),
          jobs: payload.upload.jobs || [],
        };
        setActiveUpload(mapped);
        setPollingError("");

        if (TERMINAL_UPLOAD_STATUSES.has(mapped.status)) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      } catch (error) {
        setPollingError(
          error instanceof Error ? error.message : "Failed to poll upload status"
        );
      }
    },
    []
  );

  const startPolling = useCallback(
    (uploadId: string) => {
      pollUpload(uploadId);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      pollTimerRef.current = setInterval(() => pollUpload(uploadId), 5_000);
    },
    [pollUpload]
  );

  const handleStartUpload = useCallback(async () => {
    if (!parsedRows.length) {
      setErrorMessage("Please upload a spreadsheet first.");
      return;
    }
    if (!userEmail) {
      setErrorMessage("Unable to determine uploader email. Please check your account profile.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setStatusMessage("Submitting upload to Gemini queue…");

    try {
      const res = await fetch("/api/gemini/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedRows,
          originalFilename: originalFilename || "admin-upload.csv",
          uploaderEmail: userEmail,
          forceHidden,
          summary: {
            rowCount: parsedRows.length,
            sourceFilename: originalFilename,
          },
        }),
      });

      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const payload = (await res.json()) as { error?: string; details?: string };
          if (payload?.error) {
            message = payload.error;
            if (payload.details) message += ` – ${payload.details}`;
          }
        } catch {
          const txt = await res.text().catch(() => "");
          if (txt) message = txt;
        }
        throw new Error(message);
      }

      const data = (await res.json()) as {
        uploadId: string;
        status: string;
        summary: Record<string, unknown> | null;
        batchCount: number;
      };

      setActiveUpload({
        uploadId: data.uploadId,
        status: data.status,
        summary: data.summary,
        batches: [],
        jobs: [],
      });
      setStatusMessage(
        `Queued ${data.batchCount} batch${data.batchCount === 1 ? "" : "es"} for Gemini processing.`
      );
      setPollingError("");
      startPolling(data.uploadId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to queue upload"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    parsedRows,
    userEmail,
    originalFilename,
    forceHidden,
    startPolling,
  ]);

  const handleBatchAction = useCallback(
    async (batchId: string, action: "retry" | "skip") => {
      if (!activeUpload) return;
      const uploadId = activeUpload.uploadId;
      if (!uploadId) return;

      let reason: string | undefined;
      if (action === "skip") {
        const input = window.prompt(
          "Optional reason for marking this batch for re-upload:",
          "Manual review required"
        );
        if (input === null) return;
        reason = input.trim();
      }

      const actionKey = `${batchId}:${action}`;
      setBatchAction(actionKey);
      setErrorMessage("");
      setStatusMessage(
        action === "retry"
          ? "Requeuing batch for Gemini processing…"
          : "Marking batch for manual review…"
      );
      try {
        const res = await fetch(
          `/api/gemini/uploads/${uploadId}/batches/${batchId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              reason ? { action, reason } : { action }
            ),
          }
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Batch action failed (${res.status})`);
        }
        const data = (await res.json()) as { upload: UploadStatusView | null };
        if (data.upload) {
          setActiveUpload(data.upload);
          setStatusMessage(
            action === "retry"
              ? "Batch requeued successfully."
              : "Batch flagged for manual review."
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update batch.";
        setErrorMessage(message);
      } finally {
        setBatchAction(null);
      }
    },
    [activeUpload]
  );

  const processRows = useCallback(
    async (rows: Array<Record<string, unknown>>, fileName: string) => {
      const mapped = rows.map(mapHeaders).filter((r) => Object.keys(r).length);
      if (!mapped.length) {
        setErrorMessage("No rows found in the file.");
        setStatusMessage("");
        return;
      }
      if (!hasRequiredHeaders(mapped[0])) {
        setErrorMessage(
          "Missing required headers. Expected: municipality, state, firstName, lastName, position (or race/office), year, email"
        );
      }

      const emailCheck = validateEmails(mapped);
      setEmailValidation(emailCheck);
      if (!emailCheck.ok) {
        setErrorMessage(
          `Email validation failed: ${emailCheck.errors.length} issue(s) found.`
        );
      }

      console.log(`[Upload Preview] ${fileName}: ${mapped.length} rows`);
      setStatusMessage(`Parsed ${mapped.length} rows. Check console for preview.`);
      setParsedRows(mapped);
    },
    []
  );

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMessage("");
      setStatusMessage("Parsing file…");
      setActiveUpload(null);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        setOriginalFilename(file.name);
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
          await processRows(rows, file.name);
        } else {
          setErrorMessage("Unsupported file type. Please upload a CSV or Excel file.");
          setStatusMessage("");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to parse file. See console for details.");
        setStatusMessage("");
      }
    },
    [processRows]
  );


  const normalizeGroupKey = useCallback((r: Row): string => {
    const city = (r.municipality || "").trim().toLowerCase();
    const state = (r.state || "").trim().toLowerCase();
    const position = String(r.position ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return `${city}|${state}|${position || "unknown-position"}`;
  }, []);

  const groupRowsByMunicipalityAndPosition = useCallback(
    (
      rows: Row[]
    ): Array<{
      key: string;
      municipality: string;
      state: string;
      position: string;
      rows: Row[];
    }> => {
      const map = new Map<
        string,
        {
          key: string;
          municipality: string;
          state: string;
          position: string;
          rows: Row[];
        }
      >();
      for (const r of rows) {
        const key = normalizeGroupKey(r);
        if (!map.has(key)) {
          map.set(key, {
            key,
            municipality: (r.municipality || "").trim(),
            state: (r.state || "").trim(),
            position: String(r.position ?? "").trim(),
            rows: [],
          });
        }
        map.get(key)!.rows.push(r);
      }
      return Array.from(map.values()).sort((a, b) => {
        const s = (a.state || "").localeCompare(b.state || "");
        if (s !== 0) return s;
        const m = (a.municipality || "").localeCompare(b.municipality || "");
        if (m !== 0) return m;
        return (a.position || "").localeCompare(b.position || "");
      });
    },
    [normalizeGroupKey]
  );

  const rowGroups = useMemo(() => {
    if (!parsedRows.length) return [] as ReturnType<typeof groupRowsByMunicipalityAndPosition>;
    return groupRowsByMunicipalityAndPosition(parsedRows);
  }, [parsedRows, groupRowsByMunicipalityAndPosition]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Upload Candidate Spreadsheet</h1>
        <p className="text-sm text-muted-foreground">
          Parse CSV/Excel rows, enqueue Gemini processing, and monitor batch progress.
        </p>
      </header>

      <section className="space-y-3 rounded border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col text-sm font-medium">
            Upload spreadsheet
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="mt-1"
            />
          </label>
          <div className="flex items-center gap-2 text-sm">
            <input
              id="forceHidden"
              type="checkbox"
              checked={forceHidden}
              onChange={(event) => setForceHidden(event.target.checked)}
            />
            <label htmlFor="forceHidden">Force hidden on import</label>
          </div>
          <button
            type="button"
            disabled={!parsedRows.length || submitting || !isLoaded || !isSignedIn}
            onClick={handleStartUpload}
            className="rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Queuing…" : "Queue Gemini Jobs"}
          </button>
        </div>
        {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {pollingError && <p className="text-sm text-amber-600">{pollingError}</p>}
        <div className="text-xs text-muted-foreground">
          <p>
            Gemini mode: {mockMode ? "Mock" : "Live"}
            {modelName ? ` · Model: ${modelName}` : ""}
          </p>
          <p>Rows parsed: {parsedRows.length}</p>
          <p>Uploader email: {userEmail || "(unknown)"}</p>
        </div>
      </section>

      {emailValidation.errors.length > 0 && (
        <section className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 className="font-medium">Email validation issues</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {emailValidation.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {rowGroups.length > 0 && (
        <section className="space-y-3 rounded border p-4">
          <h2 className="font-medium">Detected Groups</h2>
          <p className="text-sm text-muted-foreground">
            Rows are grouped by municipality, state, and position before Gemini processing.
          </p>
          <div className="space-y-2">
            {rowGroups.map((group) => (
              <div key={group.key} className="rounded border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                  <span>
                    {group.municipality || "(unknown city)"}, {group.state || "(state)"}
                    {group.position ? ` · ${group.position}` : ""}
                  </span>
                  <span className="text-muted-foreground">{group.rows.length} row(s)</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeUpload && (
        <section className="space-y-4 rounded border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Upload Progress</h2>
              <p className="text-sm text-muted-foreground">Upload ID: {activeUpload.uploadId}</p>
            </div>
            <span className="rounded bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Status: {activeUpload.status}
            </span>
          </div>

          {activeUpload.batches.length > 0 ? (
            <div className="space-y-3">
              {activeUpload.batches.map((batch) => (
                <div key={batch.id} className="space-y-2 rounded border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {batch.municipality || "(city)"}, {batch.state || "(state)"}
                        {batch.position ? ` · ${batch.position}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">Batch ID: {batch.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                        {batch.status}
                      </span>
                      {(["FAILED", "NEEDS_REUPLOAD"].includes(batch.status)) && (
                        <button
                          type="button"
                          className="rounded border border-purple-600 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-600 hover:text-white disabled:opacity-50"
                          disabled={batchAction === `${batch.id}:retry`}
                          onClick={() => handleBatchAction(batch.id, "retry")}
                        >
                          {batchAction === `${batch.id}:retry` ? "Requeuing…" : "Retry"}
                        </button>
                      )}
                      {batch.status !== "COMPLETED" && batch.status !== "NEEDS_REUPLOAD" && (
                        <button
                          type="button"
                          className="rounded border border-amber-600 px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-600 hover:text-white disabled:opacity-50"
                          disabled={batchAction === `${batch.id}:skip`}
                          onClick={() => handleBatchAction(batch.id, "skip")}
                        >
                          {batchAction === `${batch.id}:skip` ? "Marking…" : "Mark for Re-upload"}
                        </button>
                      )}
                    </div>
                  </div>
                  {batch.errorReason && (
                    <p className="text-xs text-red-600">{batch.errorReason}</p>
                  )}
                  <div className="space-y-2">
                    {batch.jobs.map((job) => (
                      <div key={job.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{job.type}</span>
                          <span>{job.status}</span>
                        </div>
                        {job.lastError && (
                          <p className="mt-1 text-xs text-red-600">{job.lastError}</p>
                        )}
                        {job.attempts[0] && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Model: {job.attempts[0].modelUsed}
                            {job.attempts[0].isFallback ? " (fallback)" : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Batches pending load…</p>
          )}

          {activeUpload.summary && (
            <div className="rounded border bg-slate-50 p-3 text-xs">
              <p className="font-medium">Summary</p>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(activeUpload.summary, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function mapHeaders<T extends Record<string, unknown>>(obj: T): Row {
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
  const asStr = (v: unknown): string =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  for (const key of Object.keys(obj)) {
    const norm = normalizeHeader(key);
    const val = (obj as Record<string, unknown>)[key];
    switch (norm) {
      case "municipality":
        mapped.municipality = asStr(val);
        break;
      case "state":
        mapped.state = asStr(val);
        break;
      case "firstName":
      case "firstname":
      case "first":
        mapped.firstName = asStr(val);
        break;
      case "lastName":
      case "lastname":
      case "last":
        mapped.lastName = asStr(val);
        break;
      case "position":
        mapped.position = asStr(val);
        break;
      case "positiontitle":
      case "office":
      case "seat":
      case "contest":
      case "role":
        if (!mapped.position) {
          mapped.position = asStr(val);
        }
        break;
      case "race":
      case "racename":
      case "racetitle":
        if (!mapped.position) {
          mapped.position = asStr(val);
        }
        mapped.raceLabel = asStr(val);
        break;
      case "year":
        if (typeof val === "number" || typeof val === "string")
          mapped.year = String(val);
        break;
      case "email":
      case "Email":
        mapped.email = asStr(val);
        break;
      case "name":
        mapped.name = asStr(val);
        const parts = mapped.name.split(" ");
        if (!mapped.firstName) mapped.firstName = parts[0] || "";
        if (!mapped.lastName)
          mapped.lastName = parts.slice(1).join(" ");
        break;
      case "district":
        mapped.district = asStr(val);
        break;
      case "districttype":
        mapped.districtType = asStr(val);
        break;
      case "term":
      case "termtype":
        mapped.termType = asStr(val);
        break;
      case "termlength":
        mapped.termLength = asStr(val);
        break;
      case "mailingaddress":
        mapped.mailingAddress = asStr(val);
        break;
      case "phone":
        mapped.phone = asStr(val);
        break;
      case "filingdate":
        mapped.filingDate = asStr(val);
        break;
      case "party":
      case "partypreference":
        mapped.partyPreference = asStr(val);
        break;
      case "status":
        mapped.status = asStr(val);
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
