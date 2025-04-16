"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Suspense } from "react";
import ElectionResultsClient from "./ElectionResultsClient";
import { ElectionWithCandidates } from "./ElectionResultsClient";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ElectionResultsPage() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const electionID = searchParams.get("electionID");

  const { data: elections, isLoading } = useSWR<ElectionWithCandidates[]>(
    `/api/elections?city=${city}&state=${state}`,
    fetcher
  );

  return (
    <>
      {isLoading ? (
        <div className="w-screen h-screen flex items-center justify-center">
          Loading...
        </div>
      ) : (
        <ElectionResultsClient elections={elections || []} initialElectionID={electionID} />
      )}
    </>
  );
}

export default function ElectionResults() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ElectionResultsPage />
    </Suspense>
  );
}
