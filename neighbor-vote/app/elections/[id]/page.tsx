"use client";

import CandidateCard from "../../../components/CandidateCard";
import { useState, useEffect } from "react";

// Simulated candidates for testing
const candidates_test = [
  {
    id: 5,
    name: "Travis Brooks",
    description: "Running for District 1 - City Council",
    link: "/candidates/5",
  },
  {
    id: 6,
    name: "Veronica Pillar",
    description: "Running for District 2 - City Council",
    link: "/candidates/6",
  },
];

type candidate_data = {
  id: number;
  name: string;
  description: string;
  link: string;
};

export default function MeetCandidates() {
  const [candidates, setCandidates] = useState<candidate_data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        // Uncomment this line when integrating with API
        // const res = await fetch("/api/candidates");
        // if (!res.ok) throw new Error("Failed to fetch candidates");
        // const data = await res.json();
        const data = candidates_test; // Use test data for now
        setCandidates(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) {
    return <div>Loading candidates...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-6">Meet the Candidates</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            name={candidate.name}
            description={candidate.description}
            onVisit={() => (window.location.href = candidate.link)}
          />
        ))}
      </div>
    </div>
  );
}
