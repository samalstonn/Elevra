"use client";

import { useEffect, useMemo, useState } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { debounce } from "@/lib/debounce";
import type { University } from "@/lib/universities";

type Props = {
  defaultCountry?: string;
  onSelect?: (u: University) => void;
};

export default function UniversitySearch({
  defaultCountry = "United States",
  onSelect,
}: Props) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [results, setResults] = useState<University[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useMemo(
    () =>
      debounce(async (q: string, c: string) => {
        const qTrim = q.trim();
        const cTrim = c.trim();
        // Require at least 2 characters in the name before searching
        if (qTrim.length < 2) {
          setLoading(false);
          setError(null);
          setResults(null);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          if (qTrim) params.set("name", qTrim);
          if (cTrim) params.set("country", cTrim);
          const res = await fetch(`/api/universities?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed ${res.status}`);
          const data = (await res.json()) as University[];
          setResults(data);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          // If server error (e.g. 500), suppress the raw error and show the friendly hint
          const isServerError =
            /Failed\s+5\d\d/.test(msg) || msg.includes("500");
          setError(isServerError ? "SERVER_500" : msg);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    // Only trigger when the name input is meaningful
    if (name.trim().length >= 2) {
      doSearch(name, country);
    } else {
      setResults(null);
      setError(null);
      setLoading(false);
    }
  }, [name, country, doSearch]);

  const nameTrim = name.trim();
  const showEarlyHint =
    !loading &&
    (error === "SERVER_500" || (nameTrim.length > 0 && nameTrim.length < 2));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search university name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full sm:w-60 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Country (e.g., United States)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && error !== "SERVER_500" && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {showEarlyHint && (
        <p className="text-sm text-muted-foreground">
          No results for the first few letters. Keep typing to search.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="divide-y rounded-md border">
          {results.slice(0, 7).map((u) => {
            const homepage = u.web_pages?.[0] ?? "";
            let host = "";
            try {
              host = homepage ? new URL(homepage).hostname : "";
            } catch {
              host = "";
            }
            const ddg = host
              ? `https://icons.duckduckgo.com/ip3/${host}.ico`
              : "/default-image-college.png";
            const clearbit = host
              ? `https://logo.clearbit.com/${host}`
              : "/default-image-college.png";
            return (
              <li
                key={`${u.name}-${u.country}-${u["state-province"] ?? ""}`}
                className="p-3 text-sm cursor-pointer hover:bg-gray-50"
                onClick={() => onSelect?.(u)}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <ImageWithFallback
                      src={clearbit}
                      alt={`${u.name} logo`}
                      width={20}
                      height={12}
                      className="rounded bg-white ring-1 ring-gray-200"
                      fallbackSrc={[ddg, "/default-image-college.png"]}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {results && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">No universities found.</p>
      )}
    </div>
  );
}
