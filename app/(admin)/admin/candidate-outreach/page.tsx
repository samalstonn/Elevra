"use client";

import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { buildScheduledIso, buildScheduleDisplay } from "./helpers";
import { normalizeHeader, validateEmails } from "@/election-source/helpers";

type OutreachRow = {
  firstName: string;
  lastName: string;
  email: string;
  candidateLink: string;
};

const REQUIRED_HEADERS = [
  "firstname",
  "lastname",
  "email",
  "candidatelink",
] as const;

export default function CandidateOutreachPage() {
  usePageTitle("Admin – Candidate Outreach");

  const [rows, setRows] = useState<OutreachRow[]>([]);
  const [stateInput, setStateInput] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [result, setResult] = useState<string>("");
  const [useFollowup, setUseFollowup] = useState<boolean>(false);
  const [emailValidation, setEmailValidation] = useState<{
    ok: boolean;
    errors: string[];
  }>({ ok: true, errors: [] });
  const [scheduleDate, setScheduleDate] = useState<string>(""); // yyyy-mm-dd
  const [scheduleTime, setScheduleTime] = useState<string>(""); // HH:mm
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [pendingScheduledIso, setPendingScheduledIso] = useState<string | undefined>(undefined);

  async function handleFile(file: File) {
    setError("");
    setStatus("Parsing file…");
    setRows([]);
    setEmailValidation({ ok: true, errors: [] });
    setResult("");
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
        const raw = (parsed.data as Record<string, unknown>[]) || [];
        const mapped = raw
          .map(mapRow)
          .filter((r) => r !== null) as OutreachRow[];
        if (!mapped.length) {
          setError("No data rows found.");
          setStatus("");
          return;
        }
        if (!hasRequiredHeaders(parsed.meta?.fields || [])) {
          setError(
            "Missing required headers. Expected: FirstName, LastName, Email, CandidateLink"
          );
        }
        const validation = validateEmails(mapped);
        setEmailValidation(validation);
        setRows(mapped);
        setStatus(`Parsed ${mapped.length} rows.`);
      } else {
        setError("Unsupported file type. Please upload a CSV file.");
        setStatus("");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to parse file. See console for details.");
      setStatus("");
    }
  }

  function hasRequiredHeaders(headers: string[]): boolean {
    if (!headers || !headers.length) return false;
    const set = new Set(headers.map((h) => normalizeHeader(h)));
    const needed = REQUIRED_HEADERS;
    return needed.every((n) => set.has(n));
  }

  function mapRow(obj: Record<string, unknown>): OutreachRow | null {
    const get = (want: string[]): string => {
      const wantSet = new Set(want.map(normalizeHeader));
      for (const k of Object.keys(obj)) {
        if (wantSet.has(normalizeHeader(k))) {
          const v = obj[k];
          if (typeof v === "string") return v.trim();
          if (typeof v === "number") return String(v);
        }
      }
      return "";
    };
    const firstName = get(["FirstName", "first", "fname"]); // lenient
    const lastName = get(["LastName", "last", "lname"]);
    const email = get(["Email"]);
    const candidateLink = get(["CandidateLink", "link", "url", "profile"]);
    const row = { firstName, lastName, email, candidateLink };
    // Filter out completely empty rows
    if (Object.values(row).every((v) => !String(v || "").trim())) return null;
    return row;
  }


  function onClickSend() {
    if (!rows.length) {
      setError("Please upload a CSV first.");
      return;
    }
    const iso = buildScheduledIso(scheduleDate, scheduleTime);
    setPendingScheduledIso(iso);
    const display = buildScheduleDisplay(scheduleDate, scheduleTime);
    setConfirmMessage(`Schedule ${rows.length} email(s) for ${display}?`);
    setConfirmVisible(true);
  }

  async function sendEmails(scheduledAtIso?: string) {
    if (!rows.length) {
      setError("Please upload a CSV first.");
      return;
    }
    setSending(true);
    setStatus("Sending emails…");
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/admin/email-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          __proxyPath: "/api/admin/candidate-outreach",
          state: stateInput.trim() || undefined,
          rows,
          followup: useFollowup || undefined,
          scheduledAtIso,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(String(data?.error || "Failed to send emails"));
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.error(e);
      setError("Unexpected error while sending emails.");
    } finally {
      setSending(false);
      setStatus("");
    }
  }

  const previewRows = showAll ? rows : rows.slice(0, 5);

  return (
    <main className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-2">Candidate Outreach</h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload a CSV with columns: FirstName, LastName, Email, CandidateLink.
        Preview the first 5 rows, set State, optionally schedule a send date/time,
        and send via Resend.
      </p>

      <div className="space-y-3 bg-white/70 p-4 rounded border">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
          className="block w-full text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="NJ (default if none inputted)"
              className="w-full rounded border px-3 py-2"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={useFollowup}
                onChange={(e) => setUseFollowup(e.target.checked)}
              />
              Use follow-up template
            </label>
          </div>
          <button
            type="button"
            onClick={onClickSend}
            disabled={!rows.length || sending || !emailValidation.ok}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Emails"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Send Date (optional)</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Send Time (optional)</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Uses your local timezone; emails send at exactly this local time.</p>
          </div>
        </div>

        {status && <p className="text-green-700 text-sm">{status}</p>}
        {error && <p className="text-red-700 text-sm">{error}</p>}
        {!emailValidation.ok && (
          <p className="text-red-700 text-xs">
            Email validation failed ({emailValidation.errors.length})
          </p>
        )}

        {!!rows.length && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">
                Showing {previewRows.length} of {rows.length} rows
              </div>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-sm text-purple-700 underline"
              >
                {showAll ? "Show first 5" : "Show all"}
              </button>
            </div>
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-2">First Name</th>
                    <th className="p-2">Last Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Candidate Link</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.firstName}</td>
                      <td className="p-2">{r.lastName}</td>
                      <td className="p-2">{r.email}</td>
                      <td className="p-2 break-all">
                        <a
                          className="text-purple-700 hover:underline"
                          href={r.candidateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {r.candidateLink}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <label className="text-sm font-medium mb-1 inline-block">
              Result
            </label>
            <textarea
              readOnly
              className="w-full h-64 rounded border px-3 py-2 font-mono text-xs"
              value={result}
            />
          </div>
        )}
      </div>

      {confirmVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded border shadow max-w-md w-full p-4">
            <h3 className="text-sm font-semibold mb-2">Confirm Send</h3>
            <p className="text-sm text-gray-800 mb-4">{confirmMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setConfirmVisible(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-purple-600 text-white rounded"
                onClick={() => {
                  setConfirmVisible(false);
                  void sendEmails(pendingScheduledIso);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
