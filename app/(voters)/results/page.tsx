import prisma from "@/prisma/prisma";
import { Suspense } from "react";
import ElectionResultsClient from "./ElectionResultsClient";
import { Candidate } from "@prisma/client";

interface ElectionResultsPageProps {
  searchParams: {
    city?: string;
    state?: string;
  };
}

async function ElectionResultsPage({ searchParams }: ElectionResultsPageProps) {
  const resolvedSearchParams = await searchParams;
  const city = resolvedSearchParams.city;
  const state = resolvedSearchParams.state;

  if (!city || !state) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
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
        include: {
          candidate: true,
        },
      },
    },
  });

  interface ElectionCandidate {
    candidate: Candidate; // Relaxing the type to any
  }

  // Reshape the candidates array for each election to be a flat array of Candidate objects
  const reshapedElections = elections.map((election) => ({
    ...election,
    candidates: election.candidates.map(
      (ec: ElectionCandidate) => ec.candidate
    ),
  }));

  return (
    <>
      <ElectionResultsClient
        elections={reshapedElections}
        initialElectionID={null}
      />
    </>
  );
}

export default function ElectionResults({
  searchParams,
}: ElectionResultsPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ElectionResultsPage searchParams={searchParams} />
    </Suspense>
  );
}
