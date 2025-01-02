'use client';

import React, { useState, useEffect } from 'react';

type CandidateData = {
  id: string;
  name: string;
  position: string;
  bio: string;
  policies: string[];
  website: string;
  verified: boolean;
};

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        const { id } = await params; 
        const response = await fetch(`/api/candidate/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch candidate data: ${response.statusText}`);
        }
        const data: CandidateData = await response.json();
        setCandidate(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, [params]); 
  if (loading) {
    return <div>Loading candidate data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!candidate) {
    return <div>Candidate not found.</div>;
  }

  return (
    <div className="bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-800">{candidate.name}</h1>
        <p className="text-lg text-gray-600 mt-2">{candidate.position}</p>
        {candidate.verified && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mt-2 inline-block">
            Verified
          </span>
        )}

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Bio Summary</h2>
          <p className="text-gray-600 mt-2">{candidate.bio}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Key Policy Positions</h2>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {candidate.policies.map((policy, index) => (
              <li key={index}>{policy}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Contact & Campaign</h2>
          <p className="text-gray-600 mt-2">
            <strong>Website:</strong>{' '}
            <a
              href={candidate.website}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Campaign Website
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
