"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { isElectionActive } from "@/lib/isElectionActive";
import {
  buildSuggestedElectionOrder,
  orderLiveElectionsByPriority,
  type CandidateElectionSummary,
} from "@/lib/liveElectionOrdering";

interface RawElectionSummary {
  city: string | null;
  state: string;
  position: string;
  date: string | Date;
}
interface SuggestedElection {
  city: string | null;
  state: string;
  positions: string[];
  date: string | Date;
}

type SuggestedCandidateResponse = CandidateElectionSummary & {
  id: number;
  slug: string;
};

export interface LiveElectionBannerProps {
  title?: string;
  limit?: number;
  className?: string;
  fullWidth?: boolean; // apply 100vw centering trick
  showViewAllLink?: boolean;
}

export const LiveElectionBanner: React.FC<LiveElectionBannerProps> = ({
  title = "Trending Live Elections",
  limit = 12,
  className = "",
  fullWidth = true,
  showViewAllLink = true,
}) => {
  const [suggested, setSuggested] = useState<SuggestedElection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchSuggested = async () => {
      setLoading(true);
      setError(null);
      try {
        const [electionRes, suggestedCandidatesRes] = await Promise.all([
          fetch("/api/elections?city=all&state=all", {
            signal: controller.signal,
          }),
          fetch("/api/suggested-candidates", {
            signal: controller.signal,
          }),
        ]);

        if (!electionRes.ok) throw new Error("Failed to fetch elections");
        let data: RawElectionSummary[] = await electionRes.json();
        let suggestedCandidateData: SuggestedCandidateResponse[] = [];

        if (suggestedCandidatesRes.ok) {
          suggestedCandidateData = await suggestedCandidatesRes.json();
        } else {
          const fallbackMessage = await suggestedCandidatesRes
            .text()
            .catch(() => suggestedCandidatesRes.statusText);
          console.warn(
            "Failed to fetch suggested candidates order",
            fallbackMessage
          );
        }
        data = data.filter((e) => isElectionActive(new Date(e.date)));
        const map = new Map<
          string,
          {
            city: string | null;
            state: string;
            positions: Set<string>;
            date: string | Date;
          }
        >();
        for (const e of data) {
          const key = `${e.city || ""},${e.state}`;
          if (!map.has(key)) {
            map.set(key, {
              city: e.city,
              state: e.state,
              positions: new Set<string>(),
              date: e.date,
            });
          }
          map.get(key)!.positions.add(e.position);
        }
        const grouped: SuggestedElection[] = Array.from(map.values()).map(
          (v) => ({
            city: v.city,
            state: v.state,
            positions: Array.from(v.positions),
            date: v.date,
          })
        );

        const prioritizedKeys = buildSuggestedElectionOrder(
          suggestedCandidateData
        );
        const ordered = orderLiveElectionsByPriority(grouped, prioritizedKeys);
        const limited = ordered.slice(0, limit);

        if (!cancelled) {
          setSuggested(limited);
        }
      } catch (err: unknown) {
        // Swallow abort errors; show others
        if (!cancelled) {
          // In browsers, an aborted fetch rejects with a DOMException named 'AbortError'.
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSuggested();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [limit]);

  return (
    <section
      className={`bg-purple-50 border-y border-purple-200 py-5 ${className}`}
      style={
        fullWidth
          ? {
              position: "relative",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100vw",
            }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto w-full px-4">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-700 mb-3 text-center tracking-tight">
          {title}
        </h2>
        {loading && (
          <p className="text-xs sm:text-sm text-gray-500 text-center mb-3">
            Loading suggestions...
          </p>
        )}
        {error && (
          <p className="text-xs sm:text-sm text-red-500 text-center mb-3">
            {error}
          </p>
        )}
        {!loading && !error && suggested.length === 0 && (
          <p className="text-xs sm:text-sm text-gray-500 text-center mb-3">
            No active elections to suggest right now.
          </p>
        )}
      </div>
      {suggested.length > 0 && (
        <div className="relative w-full overflow-hidden">
          <div
            className="flex gap-3 sm:gap-4 animate-election-ticker px-4"
            aria-label="Active elections ticker"
            role="list"
          >
            {[...suggested, ...suggested].map((e, idx) => {
              const location = e.city ? `${e.city}, ${e.state}` : e.state;
              const isDuplicate = idx >= suggested.length;
              const href =
                e.city && e.city.length > 0
                  ? `/results?city=${encodeURIComponent(
                      e.city
                    )}&state=${encodeURIComponent(e.state)}`
                  : `/results?state=${encodeURIComponent(e.state)}`;

              return (
                <Link
                  key={`${location}-${idx}`}
                  href={href}
                  prefetch={false}
                  aria-label={`View election results for ${location}`}
                  aria-hidden={isDuplicate}
                  role="listitem"
                  className="shrink-0 w-52 sm:w-60 md:w-64 bg-white rounded-md px-3 py-2.5 shadow-sm hover:shadow-md hover:bg-purple-100 transition flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <span
                    className="font-medium text-xs sm:text-sm text-gray-900 truncate"
                    title={location}
                  >
                    {location}
                  </span>
                  <div className="mt-0.5 text-[10px] sm:text-[11px] text-gray-600 leading-snug line-clamp-3">
                    {e.positions.slice(0, 3).join(" • ")}
                    {e.positions.length > 3 && ` • +${e.positions.length - 3}`}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-purple-50 to-transparent" />
        </div>
      )}
      {showViewAllLink && suggested.length > 0 && (
        <div className="flex justify-center mt-4 px-4">
          <Link
            href="/live-elections"
            className="text-[10px] sm:text-xs font-medium text-purple-700 hover:underline"
          >
            View all live elections →
          </Link>
        </div>
      )}
      <style jsx>{`
        @keyframes election-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-election-ticker {
          width: max-content;
          /* Slow, calm marquee speed */
          animation: election-ticker 90s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-election-ticker {
            animation-duration: 70s;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-election-ticker {
            animation-play-state: paused;
          }
        }
      `}</style>
    </section>
  );
};

export default LiveElectionBanner;
