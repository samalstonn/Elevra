import prisma from "@/prisma/prisma";
import type { Metadata } from "next";
import { Suspense } from "react";
import ElectionResultsClient from "./ElectionResultsClient";
import { Candidate } from "@prisma/client";

interface ElectionResultsPageProps {
  searchParams: {
    city?: string;
    state?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: ElectionResultsPageProps): Promise<Metadata> {
  const city = searchParams.city;
  const state = searchParams.state;

  if (city && state) {
    const loc = `${city}, ${state}`;
    const title = `Election Results – ${loc}`;
    const description = `See election results for ${loc} on Elevra and explore candidate profiles.`;
    const keywords = [
      `${city} ${state} school board`,
      `${city} ${state} election results`,
      "school board election",
      "election results",
      "Elevra",
      "elevra community",
      "elevracommunity",
    ];
    return {
      title,
      description,
      keywords,
      openGraph: { title, description },
      twitter: { title, description },
    };
  }
  return {
    title: "Election Results",
    description: "Discover local election results and candidate information on Elevra.",
    keywords: [
      "election results",
      "school board election",
      "Elevra",
      "elevra community",
      "elevracommunity",
    ],
  };
}

async function ElectionResultsPage({ searchParams }: ElectionResultsPageProps) {
  const city = searchParams.city;
  const state = searchParams.state;

  if (!city || !state) {
    return (
      <div className="w-full h-screen flex items-center justify-center px-4">
        Please provide a city and state.
      </div>
    );
  }
  const elections = await prisma.election.findMany({
    where: {
      city: city,
      state: state,
    },
    include: {
      candidates: {
        where: {
          candidate: { hidden: false },
        },
        include: {
          candidate: true,
        },
      },
    },
  });

  // Include both past and future elections in results (no date filtering)
  const activeElections = elections;

  interface ElectionCandidate {
    candidate: Candidate;
  }

  // Reshape the candidates array for each election to be a flat array of Candidate objects
  const reshapedElections = activeElections.map((election) => ({
    ...election,
    candidates: election.candidates.map(
      (ec: ElectionCandidate) => ec.candidate
    ),
  }));

  return (
    <div className="p-0 m-0">
      <ElectionResultsClient
        elections={reshapedElections}
        initialElectionID={null}
      />
    </div>
  );
}

export default function ElectionResults({
  searchParams,
}: ElectionResultsPageProps) {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ElectionResultsPage searchParams={searchParams} />
    </Suspense>
  );
}

function ResultsSkeleton() {
  return (
    <div className="w-full p-4 space-y-4 animate-pulse">
      {/* Filter skeleton */}
      <div className="flex space-x-4 overflow-x-auto no-scrollbar mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      {/* Candidate sections skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
