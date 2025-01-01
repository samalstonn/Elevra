"use client";

import CandidateCard from "../../../components/CandidateCard";
import { useState, useEffect } from "react";

// simulated
const candidates_test = [
    {
      id: 1,
      name: "Travis Brooks",
      description: "Running for District 1 - City Council",
      link: "/candidates/travis-brooks",
    },
    {
      id: 2,
      name: "Veronica Pillar",
      description: "Running for District 2 - City Council",
      link: "/candidates/veronica-pillar",
    },
  ];

  type candidate_data = {
    id: number
    name: string
    description: string
    link: string
  }
  
  export default function CandidatesPage() {
    const [candidates, setCandidates] = 
        useState<
        candidate_data[]
    >([]);
  
    useEffect(() => {
      const fetchCandidates = async () => {
        // const res = await fetch("https://api.example.com/candidates"); 
        const data = candidates_test;
        setCandidates(data);
      };
  
      fetchCandidates();
    }, []);
  
    return (
      <div className="bg-gray-100 flex flex-col items-center p-4">
        <h1 className="text-2xl font-bold mb-6">Meet the Candidates</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              name={candidate.name}
              description={candidate.description}
              onVisit={() => window.location.href = candidate.link}
            />
          ))}
        </div>
      </div>
    );
  }
  

