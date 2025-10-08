import { isElectionActive } from "@/lib/isElectionActive";

export type CandidateElectionSummary = {
  elections?: {
    election: {
      id: number;
      city: string | null;
      state: string;
      date: string | Date;
      position?: string | null;
    } | null;
  }[];
};

export type GroupedElectionWithDate = {
  city: string | null;
  state: string;
  positions: string[];
  date: string | Date;
};

export function getElectionLocationKey(
  city: string | null | undefined,
  state: string | undefined
): string {
  const normalizedCity = (city ?? "").trim().toLowerCase();
  const normalizedState = (state ?? "").trim().toLowerCase();
  return `${normalizedCity}|${normalizedState}`;
}

export function buildSuggestedElectionOrder(
  suggestedCandidates: CandidateElectionSummary[],
  { activeOnly = true }: { activeOnly?: boolean } = {}
): string[] {
  const seen = new Set<string>();
  const order: string[] = [];

  for (const candidate of suggestedCandidates) {
    const links = candidate.elections ?? [];
    for (const link of links) {
      const election = link.election;
      if (!election) continue;
      if (activeOnly) {
        const date = election.date ? new Date(election.date) : null;
        if (!date || !isElectionActive(date)) continue;
      }
      const key = getElectionLocationKey(election.city ?? null, election.state);
      if (!key.trim() || seen.has(key)) continue;
      seen.add(key);
      order.push(key);
    }
  }

  return order;
}

export function orderLiveElectionsByPriority<T extends { city: string | null; state: string }>(
  elections: T[],
  prioritizedKeys: string[]
): T[] {
  if (elections.length === 0) {
    return elections;
  }

  if (prioritizedKeys.length === 0) {
    return shuffleArray(elections);
  }

  const priorityIndex = new Map<string, number>();
  prioritizedKeys.forEach((key, index) => {
    if (!priorityIndex.has(key)) {
      priorityIndex.set(key, index);
    }
  });

  const prioritized: T[] = [];
  const remainder: T[] = [];

  for (const election of elections) {
    const key = getElectionLocationKey(election.city ?? null, election.state);
    if (priorityIndex.has(key)) {
      prioritized.push(election);
    } else {
      remainder.push(election);
    }
  }

  prioritized.sort((a, b) => {
    const keyA = getElectionLocationKey(a.city ?? null, a.state);
    const keyB = getElectionLocationKey(b.city ?? null, b.state);
    return (
      (priorityIndex.get(keyA) ?? Number.MAX_SAFE_INTEGER) -
      (priorityIndex.get(keyB) ?? Number.MAX_SAFE_INTEGER)
    );
  });

  const shuffledRemainder = shuffleArray(remainder);

  return [...prioritized, ...shuffledRemainder];
}

export function shuffleArray<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
