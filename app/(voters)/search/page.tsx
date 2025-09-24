import Link from "next/link";
import prisma from "@/prisma/prisma";
import isElectionActive from "@/lib/isElectionActive";
import type { Candidate } from "@prisma/client";
import { CandidateImage } from "@/components/CandidateImage";

interface SearchPageProps {
  searchParams: Promise<{
    query?: string;
  }>;
}

type ElectionSuggestion = {
  city: string | null;
  state: string;
  positions: string[];
};

type CandidateSuggestion = Pick<
  Candidate,
  | "id"
  | "slug"
  | "name"
  | "currentRole"
  | "currentCity"
  | "currentState"
  | "verified"
  | "photo"
  | "photoUrl"
  | "clerkUserId"
>;

function selectRandom<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

async function loadElectionSuggestions(): Promise<ElectionSuggestion[]> {
  const now = new Date();
  const elections = await prisma.election.findMany({
    where: {
      hidden: false,
      date: {
        gte: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      },
    },
    select: {
      city: true,
      state: true,
      date: true,
      position: true,
    },
    orderBy: {
      date: "asc",
    },
    take: 40,
  });

  const grouped = new Map<string, ElectionSuggestion>();
  for (const election of elections) {
    if (!election.state) continue;
    if (!isElectionActive(new Date(election.date))) continue;
    const key = `${election.city ?? ""}_${election.state}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        city: election.city,
        state: election.state,
        positions: [],
      });
    }
    grouped.get(key)?.positions.push(election.position);
  }

  return selectRandom(Array.from(grouped.values()), 3);
}

async function loadCandidateSuggestions(): Promise<CandidateSuggestion[]> {
  const candidates = await prisma.candidate.findMany({
    where: {
      hidden: false,
    },
    orderBy: [
      { verified: "desc" },
      { updatedAt: "desc" },
    ],
    take: 30,
    select: {
      id: true,
      slug: true,
      name: true,
      verified: true,
      currentRole: true,
      currentCity: true,
      currentState: true,
      photo: true,
      photoUrl: true,
      clerkUserId: true,
    },
  });
  return selectRandom(candidates, 3);
}

export default async function SemanticSearchFallback({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";

  const [elections, candidates] = await Promise.all([
    loadElectionSuggestions(),
    loadCandidateSuggestions(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-purple-900">No direct match...</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          We couldn&apos;t find an exact destination for
          {query ? (
            <span className="font-semibold text-purple-700"> {query}</span>
          ) : (
            " that query"
          )}
          . Try one of these pages or refine your search above.
        </p>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section className="space-y-4">
          <header>
            <h2 className="text-xl font-semibold text-purple-800">
              Live election ideas
            </h2>
            <p className="text-sm text-gray-600">
              Jump into election results for cities voters are exploring now.
            </p>
          </header>
          <div className="space-y-3">
            {elections.length === 0 && (
              <p className="text-gray-500 text-sm">
                We&apos;ll add more live elections soon. In the meantime, explore
                the full list.
              </p>
            )}
            {elections.map((election) => {
              const location = election.city
                ? `${election.city}, ${election.state}`
                : election.state;
              const params = new URLSearchParams();
              if (election.city) params.set("city", election.city);
              params.set("state", election.state);
              return (
                <Link
                  key={`${location}`}
                  href={`/results?${params.toString()}`}
                  className="block rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition hover:border-purple-400 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold text-purple-700">
                    {location}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {election.positions.slice(0, 3).join(", ") || "Election"}
                    {election.positions.length > 3 ? "..." : ""}
                  </p>
                </Link>
              );
            })}
            <Link
              href="/live-elections"
              className="inline-flex items-center text-sm font-semibold text-purple-700 hover:text-purple-500"
            >
              Browse all live elections &rarr;
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <header>
            <h2 className="text-xl font-semibold text-purple-800">
              Candidate spotlights
            </h2>
            <p className="text-sm text-gray-600">
              People who viewed these candidates also explored nearby races.
            </p>
          </header>
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const locationParts = [
                candidate.currentCity,
                candidate.currentState,
              ].filter(Boolean);
              return (
                <Link
                  key={candidate.id}
                  href={`/candidate/${candidate.slug}`}
                  className="block rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition hover:border-purple-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CandidateImage
                        clerkUserId={candidate.clerkUserId}
                        publicPhoto={candidate.photo ?? candidate.photoUrl ?? null}
                        name={candidate.name}
                        width={40}
                        height={40}
                      />
                      <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {candidate.name}
                      </h3>
                      {candidate.currentRole && (
                        <p className="text-sm text-purple-700">
                          {candidate.currentRole}
                        </p>
                      )}
                      {locationParts.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {locationParts.join(", ")}
                        </p>
                      )}
                      </div>
                    </div>
                    {candidate.verified && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        Verified
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            {candidates.length === 0 && (
              <p className="text-gray-500 text-sm">
                Candidate highlights are on the way. Head back to the homepage to
                explore more.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-16">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-purple-200 bg-white px-5 py-2 text-sm font-semibold text-purple-700 shadow-sm transition hover:border-purple-400 hover:text-purple-600"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
