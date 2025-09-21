"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  type Row,
  type InsertResultItem,
  buildAndDownloadResultSheet,
} from "@/election-source/build-spreadsheet";
import { normalizeHeader, validateEmails } from "@/election-source/helpers";

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
  const [emailValidation, setEmailValidation] = useState<{
    ok: boolean;
    errors: string[];
  }>({ ok: true, errors: [] });
  const [geminiOutput, setGeminiOutput] = useState<string>("");
  const [structuredOutput, setStructuredOutput] = useState<string>("");
  const [forceHidden, setForceHidden] = useState<boolean>(true);
  // Badge state sourced from server status so only one env is needed
  const [mockMode, setMockMode] = useState(false);
  const [modelName, setModelName] = useState<string>("");
  // Collapsible sections (start collapsed)
  const [showGeminiOutput, setShowGeminiOutput] = useState(false);
  const [showStructuredOutput, setShowStructuredOutput] = useState(false);
  const [showInsertResult, setShowInsertResult] = useState(false);
  const [rawRows, setRawRows] = useState<Array<Record<string, unknown>>>([]);
  const [, setOriginalExt] = useState<string>(""); // reserved for future format-specific export
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
  const [insertResult, setInsertResult] = useState<string>("");
  const [goingLive, setGoingLive] = useState(false);
  type StepStatus = "pending" | "in_progress" | "completed" | "error";
  type Step = {
    key: string;
    label: string;
    status: StepStatus;
    detail?: string;
  };
  const [goLiveSteps, setGoLiveSteps] = useState<Step[]>([]);
  const [goLiveLog, setGoLiveLog] = useState<
    { ts: number; level: "info" | "success" | "error"; message: string }[]
  >([]);

  // Simple confirmation toast state for fallback model warnings
  const [confirmPrompt, setConfirmPrompt] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });
  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null);
  function askConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmPrompt({ visible: true, message });
    });
  }
  function confirmYes() {
    confirmResolveRef.current?.(true);
    confirmResolveRef.current = null;
    setConfirmPrompt({ visible: false, message: "" });
  }
  function confirmNo() {
    confirmResolveRef.current?.(false);
    confirmResolveRef.current = null;
    setConfirmPrompt({ visible: false, message: "" });
  }

  async function goLive() {
    if (!parsedRows.length) {
      setError("Please upload a spreadsheet first.");
      return;
    }
    const groups = groupRowsByMunicipality(parsedRows);
    if (!groups.length) {
      setError("No valid municipality groups found.");
      return;
    }
    setGoingLive(true);
    setError("");
    setInsertResult("");
    resetGoLiveProgress();
    const aggregatedElections: unknown[] = [];
    const aggregatedResults: InsertResultItem[] = [];

    try {
      updateStep(
        "process",
        "in_progress",
        `Found ${groups.length} group${
          groups.length === 1 ? "" : "s"
        }. Starting…`
      );
      logProgress(`Processing ${groups.length} group(s) sequentially…`);

      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const label = `${g.municipality || "(unknown)"}${
          g.state ? ", " + g.state : ""
        } (${g.rows.length} rows) [${i + 1}/${groups.length}]`;
        updateStep("process", "in_progress", `Current: ${label}`);
        logProgress(`Analyze → Structure → Insert: ${label}`);

        // 1) Analyze with Gemini for this group
        const analyzeRes = await fetch("/api/gemini/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: g.rows }),
        });
        if (!analyzeRes.ok || !analyzeRes.body) {
          const txt = await analyzeRes.text().catch(() => "");
          updateStep(
            "process",
            "error",
            `Analyze failed (${analyzeRes.status}) ${txt || ""}`
          );
          logProgress(
            `Analyze failed (${analyzeRes.status}) ${txt || ""}`,
            "error"
          );
          throw new Error(
            txt || `Gemini analyze failed (${analyzeRes.status})`
          );
        }
        const isMock = analyzeRes.headers.get("x-gemini-mock") === "1";
        const model = analyzeRes.headers.get("x-gemini-model") || "";
        setMockMode(isMock);
        setModelName(model);

        // Detect fallback usage and ask for confirmation
        const fallbackHeader = analyzeRes.headers.get("x-gemini-fallback");
        if (fallbackHeader) {
          const warnMsg = `WARNING: Using ${
            model || "fallback model"
          } as fallback model. Continue?`;
          logProgress(warnMsg, "error");
          const proceed = await askConfirmation(warnMsg);
          if (!proceed) {
            updateStep(
              "process",
              "error",
              "User canceled due to fallback model"
            );
            logProgress("Aborted by user on fallback warning", "error");
            throw new Error("Aborted due to fallback model");
          }
          logProgress("User confirmed fallback model continuation");
        }
        const aReader = analyzeRes.body.getReader();
        const aDecoder = new TextDecoder();
        let analysisText = "";
        while (true) {
          const { done, value } = await aReader.read();
          if (done) break;
          analysisText += aDecoder.decode(value, { stream: true });
        }
        setGeminiOutput(analysisText);

        // 2) Structure for this group
        const structRes = await fetch("/api/gemini/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previousOutput: analysisText,
            originalRows: g.rows,
          }),
        });
        if (!structRes.ok || !structRes.body) {
          const txt = await structRes.text().catch(() => "");
          updateStep(
            "process",
            "error",
            `Structure failed (${structRes.status}) ${txt || ""}`
          );
          logProgress(
            `Structure failed (${structRes.status}) ${txt || ""}`,
            "error"
          );
          throw new Error(
            txt || `Gemini structure failed (${structRes.status})`
          );
        }
        const sReader = structRes.body.getReader();
        const sDecoder = new TextDecoder();
        let sBuf = "";
        while (true) {
          const { done, value } = await sReader.read();
          if (done) break;
          sBuf += sDecoder.decode(value, { stream: true });
        }
        const elections = extractElectionsFromJson(sBuf);
        const structuredForGroup: { elections: unknown[] } = { elections };
        setStructuredOutput(JSON.stringify(structuredForGroup, null, 2));

        // 3) Insert only this group's elections into DB
        const insertRes = await fetch("/api/admin/seed-structured", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            structured: JSON.stringify(structuredForGroup),
            hidden: forceHidden,
          }),
        });
        const insertText = await insertRes.text();
        if (!insertRes.ok) {
          updateStep(
            "process",
            "error",
            `Insert failed (${insertRes.status}) ${insertText || ""}`
          );
          logProgress(
            `Insert failed (${insertRes.status}) ${insertText || ""}`,
            "error"
          );
          throw new Error(insertText || `Insert failed (${insertRes.status})`);
        }
        let insertObj: { results?: InsertResultItem[] } | null = null;
        try {
          insertObj = JSON.parse(insertText) as {
            results?: InsertResultItem[];
          };
        } catch {
          insertObj = null;
        }
        if (Array.isArray(structuredForGroup.elections)) {
          aggregatedElections.push(...structuredForGroup.elections);
        }
        if (insertObj?.results) {
          aggregatedResults.push(...insertObj.results);
        }
        const addedCandidates = (insertObj?.results || [])
          .map((r: InsertResultItem) => (r.candidateSlugs || []).length)
          .reduce((a: number, b: number) => a + b, 0);
        logProgress(
          `Group inserted: ${
            (insertObj?.results || []).length
          } elections, ${addedCandidates} candidates`,
          "success"
        );
      }

      // All groups complete, aggregate and finalize
      const aggregatedStructured = { elections: aggregatedElections };
      const aggregatedInsert: { results: InsertResultItem[] } = {
        results: aggregatedResults,
      };
      setStructuredOutput(JSON.stringify(aggregatedStructured, null, 2));
      setInsertResult(JSON.stringify(aggregatedInsert, null, 2));
      updateStep(
        "process",
        "completed",
        `Processed ${groups.length} group${groups.length === 1 ? "" : "s"}`
      );

      updateStep("post", "in_progress");
      logProgress("Building and downloading result sheet…");
      await buildAndDownloadResultSheet(
        aggregatedInsert,
        JSON.stringify(aggregatedStructured),
        rawRows,
        parsedRows
      );
      updateStep("post", "completed");
      logProgress("Go Live completed successfully", "success");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Go Live failed");
      logProgress(e instanceof Error ? e.message : "Go Live failed", "error");
    } finally {
      setGoingLive(false);
    }
  }

  function resetGoLiveProgress() {
    setGoLiveSteps([
      {
        key: "process",
        label: "Process groups (analyze → structure → insert)",
        status: "pending",
      },
      { key: "post", label: "Build result sheet", status: "pending" },
    ]);
    setGoLiveLog([]);
  }

  function updateStep(key: string, status: StepStatus, detail?: string) {
    setGoLiveSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, status, detail } : s))
    );
  }

  function logProgress(
    message: string,
    level: "info" | "success" | "error" = "info"
  ) {
    setGoLiveLog((prev) => [...prev, { ts: Date.now(), level, message }]);
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
    };
    for (const key of Object.keys(obj)) {
      const norm = normalizeHeader(key);
      const val = (obj as Record<string, unknown>)[key];
      const asStr = (v: unknown): string =>
        typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
      // Try to map common variations to our required names
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
        case "year":
          if (typeof val === "number" || typeof val === "string")
            mapped.year = val;
          break;
        case "email":
        case "Email":
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

  // --- Grouping utilities ---
  const normalizeMunicipalityKey = useCallback((r: Row): string => {
    const city = (r.municipality || "").trim().toLowerCase();
    const state = (r.state || "").trim().toLowerCase();
    return `${city}|${state}`;
  }, []);

  // --- Helpers for parsing structured JSON safely ---
  type ElectionsEnvelope = { elections: unknown[] };
  function hasElectionsArray(v: unknown): v is ElectionsEnvelope {
    if (typeof v !== "object" || v === null) return false;
    if (!("elections" in v)) return false;
    const e = (v as { elections: unknown }).elections;
    return Array.isArray(e);
  }
  function extractElectionsFromJson(text: string): unknown[] {
    try {
      const parsed: unknown = JSON.parse(text);
      if (hasElectionsArray(parsed)) return parsed.elections;
      if (Array.isArray(parsed)) return parsed as unknown[];
      return [];
    } catch {
      return [];
    }
  }

  const groupRowsByMunicipality = useCallback(
    (
      rows: Row[]
    ): Array<{
      key: string;
      municipality: string;
      state: string;
      rows: Row[];
    }> => {
      const map = new Map<
        string,
        { key: string; municipality: string; state: string; rows: Row[] }
      >();
      for (const r of rows) {
        const key = normalizeMunicipalityKey(r);
        if (!map.has(key)) {
          map.set(key, {
            key,
            municipality: (r.municipality || "").trim(),
            state: (r.state || "").trim(),
            rows: [],
          });
        }
        map.get(key)!.rows.push(r);
      }
      return Array.from(map.values()).sort((a, b) => {
        const s = (a.state || "").localeCompare(b.state || "");
        if (s !== 0) return s;
        return (a.municipality || "").localeCompare(b.municipality || "");
      });
    },
    [normalizeMunicipalityKey]
  );

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

    // Validate candidate emails immediately on upload
    const emailCheck = validateEmails(mapped);
    setEmailValidation(emailCheck);
    if (!emailCheck.ok) {
      setError(
        `Email validation failed: ${emailCheck.errors.length} issue(s) found.`
      );
    }

    const preview = mapped;
    console.log(`[Upload Preview] ${fileName}: ${preview.length} rows`);
    console.table(preview);
    setStatus(`Parsed ${mapped.length} rows. Check console for preview.`);
    setParsedRows(mapped);
  }

  // Derived groups preview based on current parsed rows
  const rowGroups = useMemo(
    () => groupRowsByMunicipality(parsedRows),
    [parsedRows, groupRowsByMunicipality]
  );

  return (
    <main className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-2">Upload Spreadsheet</h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload a CSV or Excel file with headers: municipality, state, firstName,
        lastName, position, year, email. We will log the first few rows to the
        console for verification.
      </p>

      <div className="space-y-3 bg-white/70 p-4 rounded border">
        {confirmPrompt.visible && (
          <div className="rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm flex items-center justify-between">
            <span className="font-semibold mr-3">{confirmPrompt.message}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmNo}
                className="px-3 py-1 rounded border border-red-300 text-red-800 bg-white hover:bg-red-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmYes}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}
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
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <input
            id="forceHiddenToggle"
            type="checkbox"
            className="h-4 w-4"
            checked={forceHidden}
            onChange={(e) => setForceHidden(e.target.checked)}
          />
          <label htmlFor="forceHiddenToggle" className="select-none">
            Mark inserted elections and candidates as hidden
          </label>
        </div>
        {rowGroups.length > 0 && (
          <div className="text-xs text-gray-700 bg-gray-50 border rounded p-2">
            <div className="font-medium mb-1">
              Found {rowGroups.length} group{rowGroups.length === 1 ? "" : "s"}
            </div>
            <ul className="list-disc ml-5 space-y-0.5">
              {rowGroups.map((g) => (
                <li key={g.key}>
                  {(g.municipality || "(unknown)") +
                    (g.state ? ", " + g.state : "")}{" "}
                  — {g.rows.length} rows
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="pt-2 flex flex-col gap-3">
          <>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={goLive}
                disabled={
                  !parsedRows.length || goingLive || !emailValidation.ok
                }
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                title={
                  !parsedRows.length
                    ? "Upload a file first"
                    : !emailValidation.ok
                    ? "Fix email validation errors before proceeding"
                    : "Analyze, structure, insert, and export in one flow"
                }
              >
                {goingLive ? "Going Live…" : "Go Live"}
              </button>
              {!!parsedRows.length && (
                <span className="text-xs text-gray-600 self-center">
                  Rows ready: {parsedRows.length}
                </span>
              )}
              {!emailValidation.ok && (
                <span className="text-xs text-red-600 self-center">
                  Email validation failed ({emailValidation.errors.length}){" "}
                  {emailValidation.errors.join(", ")}
                </span>
              )}
            </div>
            {(goingLive || goLiveLog.length > 0) && (
              <div className="mt-3 border rounded p-3 bg-white/60">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Go Live Progress
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resetGoLiveProgress()}
                      className="text-xs text-gray-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {goLiveSteps.length > 0 && (
                  <ul className="mb-2">
                    {goLiveSteps.map((s) => (
                      <li key={s.key} className="flex items-start gap-2 py-1">
                        <span
                          className={
                            s.status === "completed"
                              ? "text-green-600"
                              : s.status === "error"
                              ? "text-red-600"
                              : s.status === "in_progress"
                              ? "text-blue-600"
                              : "text-gray-500"
                          }
                        >
                          {s.status === "completed"
                            ? "✓"
                            : s.status === "error"
                            ? "✕"
                            : s.status === "in_progress"
                            ? "…"
                            : "•"}
                        </span>
                        <div>
                          <div className="text-sm text-gray-900">{s.label}</div>
                          {s.detail && (
                            <div className="text-xs text-gray-600 break-all">
                              {s.detail}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {goLiveLog.length > 0 && (
                  <div className="max-h-40 overflow-auto border-t pt-2">
                    {goLiveLog.map((l, i) => (
                      <div key={i} className="text-xs mb-1">
                        <span className="text-gray-500 mr-2">
                          {new Date(l.ts).toLocaleTimeString()}
                        </span>
                        <span
                          className={
                            l.level === "error"
                              ? "text-red-700"
                              : l.level === "success"
                              ? "text-green-700"
                              : "text-gray-800"
                          }
                        >
                          {l.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
