// lib/useCandidate.ts
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import type { CandidateDashboardData } from "@/types/candidate";
import type { ElectionLink, Election, ContentBlock, Document } from "@prisma/client";

export type ElectionLinkWithElection = ElectionLink & {
  election: Election;
  ContentBlock?: ContentBlock[];
  Document?: Document | null;
};

export function useCandidate() {
  const { userId, isLoaded } = useAuth();
  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  // Candidate data
  const {
    data: candidateData,
    error: candidateError,
    mutate: mutateCandidate,
    isLoading: loadingCandidate,
  } = useSWR<CandidateDashboardData>(
    isLoaded && userId ? `/api/candidate?clerkUserId=${userId}` : null,
    fetcher
  );

  // Election links for this candidate
  const candidateId = candidateData?.id;
  const {
    data: electionLinks,
    error: linksError,
    mutate: mutateLinks,
    isLoading: loadingLinks,
  } = useSWR<ElectionLinkWithElection[]>(
    candidateId ? `/api/electionlinks?candidateId=${candidateId}` : null,
    fetcher
  );

  const error = candidateError || linksError;
  const isLoading =
    loadingCandidate || (candidateId ? loadingLinks : loadingCandidate);

  const refresh = () => {
    mutateCandidate();
    mutateLinks();
  };

  return {
    data: candidateData,
    electionLinks: electionLinks ?? [],
    error,
    isLoading,
    refresh,
  };
}
