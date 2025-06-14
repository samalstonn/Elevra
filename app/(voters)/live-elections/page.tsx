"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveElectionsSkeleton from "./LiveElectionsSkeleton";
import { isElectionActive } from "@/lib/functions";

type GroupedElection = {
  city: string | null;
  state: string;
  positions: string[];
};

export default function LiveElectionsPage() {
  const [elections, setElections] = useState<GroupedElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await fetch("/api/elections?city=all&state=all");
        if (!res.ok) throw new Error("Failed to fetch elections");
        let data = await res.json();

        // Filter out non-active elections
        data = data.filter((election: { date: string | number | Date }) =>
          isElectionActive(new Date(election.date))
        );

        // Group elections by city and state
        const locationMap = new Map();
        for (const e of data) {
          const key = `${e.city || ""},${e.state}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              city: e.city,
              state: e.state,
              positions: new Set<string>(),
              date: e.date,
            });
          }
          locationMap.get(key).positions.add(e.position);
        }

        const grouped = Array.from(locationMap.values()).map((entry) => ({
          city: entry.city,
          state: entry.state,
          positions: Array.from(entry.positions),
          date: entry.date,
        }));

        const futureElections = grouped.filter((election) => {
          return isElectionActive(new Date(election.date));
        });

        console.log("Future elections:", futureElections);

        const sorted = futureElections.sort((a, b) => {
          const placeA = `${a.city || ""}, ${a.state}`.toLowerCase();
          const placeB = `${b.city || ""}, ${b.state}`.toLowerCase();
          return placeA.localeCompare(placeB);
        });

        setElections(sorted as GroupedElection[]); // cast to GroupedElection[] to match state type
      } catch (err: unknown) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">
        Live Elections
      </h1>

      {loading && <LiveElectionsSkeleton />}
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        {elections.map((election) => {
          const location = election.city
            ? `${election.city}, ${election.state}`
            : election.state;

          return (
            <Link
              key={`${election.city}-${election.state}`}
              href={`/results?city=${encodeURIComponent(
                election.city || ""
              )}&state=${encodeURIComponent(election.state)}`}
              className="block border-l-2 border-purple-600 bg-white rounded-lg px-6 py-4 shadow-lg hover:shadow-xl hover:bg-purple-50 transition w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold mb-2">{location}</h2>
                  <ul className="list-disc list-inside text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    {election.positions.map((pos: string, idx: number) => (
                      <li key={idx}>{pos}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
