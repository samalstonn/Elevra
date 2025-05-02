"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/Card";
import { Candidate, Election } from "@prisma/client";
import { CandidateImage } from "@/components/CandidateImage";
import { FaCheckCircle } from "react-icons/fa";
import { useState } from "react";

interface MobileCandidateResultsSectionProps {
  candidates?: Candidate[];
  election: Election;
  fallbackElections?: Election[];
}

export default function MobileCandidateResultsSection({
  candidates = [],
  election,
  fallbackElections = [],
}: MobileCandidateResultsSectionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const electionIsActive = new Date(election.date).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);

  // If no candidates are available
  if (!candidates || candidates.length === 0) {
    return (
      <div className="p-2">
        <h3 className="text-lg font-semibold mb-1">{election.position}</h3>
        <p className="text-sm text-gray-700 mb-2">{election.description}</p>
        <h2 className="text-lg font-semibold mb-2">No candidates available</h2>
        {fallbackElections && fallbackElections.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Check these elections:</h3>
            <ul className="list-disc list-inside">
              {fallbackElections.map((e) => (
                <li key={e.id} className="text-sm mb-1">
                  <Link href={`/election/${e.id}`}>
                    <span className="text-purple-600 hover:underline">
                      {e.position}
                    </span>
                  </Link>
                  <span className="text-gray-600">
                    {" "}
                    -{" "}
                    {new Date(e.date).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="p-2">
        <h3 className="text-lg font-semibold mb-1">{election.position}</h3>
        <p className="text-sm text-gray-700 mb-2">{election.description}</p>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-purple-600 mt-2 focus:outline-none"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-800">
              <strong>Positions:</strong> {election.positions}
            </p>
            <p className="text-sm text-gray-800">
              <strong>Election Date:</strong>{" "}
              {new Date(election.date).toLocaleDateString("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm font-medium text-gray-800">
              <strong>Status:</strong>{" "}
              <span
                className={electionIsActive ? "text-green-600" : "text-red-600"}
              >
                {electionIsActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 items-stretch">
        {candidates.map((candidate) => (
          <Link key={candidate.id} href={`/candidate/${candidate.slug}`}>
            <Card className="w-full flex items-center p-2">
              <CardContent className="flex items-center gap-3 p-0">
                <CandidateImage
                  clerkUserId={candidate.clerkUserId}
                  publicPhoto={candidate.photo}
                  name={candidate.name}
                  width={40}
                  height={40}
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 truncate">
                      {candidate.name}
                    </span>
                    <FaCheckCircle
                      className={`ml-1 ${
                        candidate.verified ? "text-blue-500" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-purple-700 truncate">
                    {candidate.currentRole}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
