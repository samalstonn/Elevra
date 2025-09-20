"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { Search, Filter, ExternalLink, Loader2 } from "lucide-react";

import { usePageTitle } from "@/lib/usePageTitle";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type SearchFilter = "all" | "candidate" | "election";

type CandidateSummary = {
  type: "candidate";
  id: number;
  name: string;
  slug: string;
  email: string | null;
  currentRole: string | null;
  currentCity: string | null;
  currentState: string | null;
  status: string;
  verified: boolean;
  hidden: boolean;
  updatedAt: string;
  createdAt: string;
  elections: Array<{
    id: number;
    position: string;
    city: string;
    state: string;
    date: string;
    type: string;
    hidden: boolean;
  }>;
};

type ElectionSummary = {
  type: "election";
  id: number;
  position: string;
  city: string;
  state: string;
  date: string;
  electionType: string;
  hidden: boolean;
  candidateCount: number;
  sampleCandidates: Array<{
    id: number;
    name: string;
    slug: string;
    verified: boolean;
    hidden: boolean;
  }>;
};

type CandidateDetail = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  currentRole: string | null;
  currentCity: string | null;
  currentState: string | null;
  bio: string | null;
  photoUrl: string | null;
  status: string;
  verified: boolean;
  hidden: boolean;
  donationCount: number;
  history: string[];
  createdAt: string;
  updatedAt: string;
  elections: Array<{
    electionId: number;
    party: string;
    policies: string[];
    sources: string[];
    additionalNotes: string | null;
    votinglink: string | null;
    election: {
      id: number;
      position: string;
      city: string;
      state: string;
      date: string;
      type: string;
      hidden: boolean;
    };
    contentBlocks: Array<ContentBlockPreview>;
  }>;
  endorsements: Array<{
    id: number;
    name: string | null;
    title: string | null;
    organization: string | null;
    quote: string | null;
    createdAt: string;
  }>;
  testimonials: Array<{
    id: number;
    content: string;
    rating: number;
    vendor: {
      id: number;
      name: string;
      slug: string;
    };
    createdAt: string;
  }>;
  donations: Array<{
    id: number;
    status: string;
    amount: number | null;
    createdAt: string;
  }>;
};

type AdminMetadata = {
  isAdmin?: boolean;
  isSubAdmin?: boolean;
};

type AdminUserResource = UserResource & {
  privateMetadata?: AdminMetadata;
  unsafeMetadata?: AdminMetadata;
};

type ElectionDetail = {
  id: number;
  position: string;
  city: string;
  state: string;
  description: string;
  date: string;
  type: string;
  hidden: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  candidates: Array<{
    candidateId: number;
    candidate: {
      id: number;
      name: string;
      slug: string;
      email: string | null;
      phone: string | null;
      verified: boolean;
      hidden: boolean;
    };
    party: string;
    policies: string[];
    votinglink: string | null;
    additionalNotes: string | null;
    sources: string[];
    contentBlocks: Array<ContentBlockPreview>;
  }>;
};

type ContentBlockPreview = {
  id: number;
  order: number;
  type: string;
  color: string | null;
  level: number | null;
  text: string | null;
  body: string | null;
  listStyle: string | null;
  items: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
};

type CandidateDetailResponse = {
  type: "candidate";
  candidate: CandidateDetail;
};
type ElectionDetailResponse = { type: "election"; election: ElectionDetail };
type DetailResponse = CandidateDetailResponse | ElectionDetailResponse;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminSearchPage() {
  usePageTitle("Admin – Search");
  const { user, isLoaded } = useUser();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    candidates: CandidateSummary[];
    elections: ElectionSummary[];
  }>({ candidates: [], elections: [] });
  const [selected, setSelected] = useState<{
    type: "candidate" | "election";
    id: number;
  } | null>(null);

  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionPendingKey, setActionPendingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ key: string; message: string } | null>(
    null
  );
  const detailCache = useRef<Map<string, DetailResponse>>(new Map());
  const adminUser = user as AdminUserResource | null;
  const metadata = adminUser?.privateMetadata ?? adminUser?.unsafeMetadata;
  const hasAccess = metadata?.isAdmin || metadata?.isSubAdmin;

  useEffect(() => {
    if (!isLoaded || !hasAccess) return;

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("query", query.trim());
        if (filter !== "all") params.set("type", filter);
        const res = await fetch(`/api/admin/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as {
          candidates: CandidateSummary[];
          elections: ElectionSummary[];
        };

        if (!active) return;
        setResults({
          candidates: data.candidates ?? [],
          elections: data.elections ?? [],
        });
        setSelected((prev) => {
          if (prev) {
            const stillExists =
              (prev.type === "candidate" &&
                data.candidates?.some((c) => c.id === prev.id)) ||
              (prev.type === "election" &&
                data.elections?.some((e) => e.id === prev.id));
            if (stillExists) return prev;
          }
          const firstCandidate = data.candidates?.[0];
          if (firstCandidate)
            return { type: "candidate", id: firstCandidate.id };
          const firstElection = data.elections?.[0];
          if (firstElection) return { type: "election", id: firstElection.id };
          return null;
        });
      } catch (err) {
        if (!active && (err as Error).name === "AbortError") return;
        console.error(err);
        if (active)
          setError((err as Error).message || "Failed to load results");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query, filter, isLoaded, hasAccess]);

  useEffect(() => {
    if (!selected || !hasAccess) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    const cacheKey = `${selected.type}:${selected.id}`;
    if (detailCache.current.has(cacheKey)) {
      setDetail(detailCache.current.get(cacheKey) ?? null);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setDetailLoading(true);
    setDetailError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/search/${selected.type}/${selected.id}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to load ${selected.type} (${res.status})`);
        }
        const data = (await res.json()) as DetailResponse;
        if (!active) return;
        detailCache.current.set(cacheKey, data);
        setDetail(data);
      } catch (err) {
        if (!active && (err as Error).name === "AbortError") return;
        console.error(err);
        if (active)
          setDetailError((err as Error).message || "Failed to load detail");
        setDetail(null);
      } finally {
        if (active) setDetailLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selected, hasAccess]);

  useEffect(() => {
    setActionError(null);
    setActionPendingKey(null);
  }, [selected]);

  const handleVisibilityToggle = async (
    entityType: "candidate" | "election",
    entityId: number,
    nextHidden: boolean
  ) => {
    const cacheKey = `${entityType}:${entityId}`;
    setActionError(null);
    setActionPendingKey(cacheKey);

    try {
      const response = await fetch(`/api/admin/search/${entityType}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: nextHidden }),
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          (payload as { error?: string })?.error ||
          `Failed to update ${entityType}`;
        throw new Error(message);
      }

      const data = payload as DetailResponse;
      detailCache.current.clear();
      detailCache.current.set(cacheKey, data);
      setDetail(data);

      setResults((previous) => {
        if (!previous) return previous;

        if (entityType === "candidate" && data.type === "candidate") {
          const hiddenValue = data.candidate.hidden;
          let candidatesChanged = false;
          const updatedCandidates = previous.candidates.map((candidate) => {
            if (candidate.id !== data.candidate.id) return candidate;
            if (candidate.hidden === hiddenValue) return candidate;
            candidatesChanged = true;
            return { ...candidate, hidden: hiddenValue };
          });

          let electionsChanged = false;
          const updatedElections = previous.elections.map((election) => {
            let samplesChanged = false;
            const updatedSamples = election.sampleCandidates.map((sample) => {
              if (sample.id !== data.candidate.id) return sample;
              if (sample.hidden === hiddenValue) return sample;
              samplesChanged = true;
              return { ...sample, hidden: hiddenValue };
            });
            if (!samplesChanged) return election;
            electionsChanged = true;
            return { ...election, sampleCandidates: updatedSamples };
          });

          if (!candidatesChanged && !electionsChanged) {
            return previous;
          }

          return {
            candidates: candidatesChanged ? updatedCandidates : previous.candidates,
            elections: electionsChanged ? updatedElections : previous.elections,
          };
        }

        if (entityType === "election" && data.type === "election") {
          const hiddenValue = data.election.hidden;
          let electionsChanged = false;
          const updatedElections = previous.elections.map((election) => {
            if (election.id !== data.election.id) return election;
            if (election.hidden === hiddenValue) return election;
            electionsChanged = true;
            return { ...election, hidden: hiddenValue };
          });

          let candidatesChanged = false;
          const updatedCandidates = previous.candidates.map((candidate) => {
            let linksChanged = false;
            const updatedLinks = candidate.elections.map((link) => {
              if (link.id !== data.election.id) return link;
              if (link.hidden === hiddenValue) return link;
              linksChanged = true;
              return { ...link, hidden: hiddenValue };
            });
            if (!linksChanged) return candidate;
            candidatesChanged = true;
            return { ...candidate, elections: updatedLinks };
          });

          if (!candidatesChanged && !electionsChanged) {
            return previous;
          }

          return {
            candidates: candidatesChanged ? updatedCandidates : previous.candidates,
            elections: electionsChanged ? updatedElections : previous.elections,
          };
        }

        return previous;
      });

      setActionError(null);
    } catch (err) {
      console.error(`Failed to toggle ${entityType} visibility`, err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : `Failed to update ${entityType}`;
      setActionError({ key: cacheKey, message });
    } finally {
      setActionPendingKey(null);
    }
  };

  const clearQuery = () => {
    setQuery("");
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <EmptyState
          primary="Admin access required to view this page."
          secondary="Please sign in with an admin or sub-admin account."
        />
      </div>
    );
  }

  const totalResults = results.candidates.length + results.elections.length;

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin Search</h1>
        <p className="text-sm text-muted-foreground">
          Quickly locate candidates or elections and review their full profile
          data.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search Filters</CardTitle>
          <CardDescription>
            Search across all records or narrow by type. Results update as you
            type.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setQuery(event.target.value)
              }
              placeholder="Search by name, slug, location, or position…"
              className="pl-9 w-full"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select
              value={filter}
              onValueChange={(value: SearchFilter) => setFilter(value)}
            >
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All records
                  </div>
                </SelectItem>
                <SelectItem value="candidate">Candidates</SelectItem>
                <SelectItem value="election">Elections</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={clearQuery}
              className="sm:w-auto"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="h-[560px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search Results</CardTitle>
            <CardDescription>
              {loading
                ? "Loading results…"
                : `${totalResults} record${
                    totalResults === 1 ? "" : "s"
                  } found.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full p-0">
            {error ? (
              <div className="p-6">
                <EmptyState
                  primary="We couldn’t load any results."
                  secondary={error}
                />
              </div>
            ) : loading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full" />
                ))}
              </div>
            ) : totalResults === 0 ? (
              <div className="p-6">
                <EmptyState
                  primary="No matching records yet."
                  secondary="Try a different search term or adjust your filters."
                />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {results.candidates.length > 0 && (
                    <section className="p-4">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        Candidates ({results.candidates.length})
                      </h3>
                      <div className="mt-3 space-y-2">
                        {results.candidates.map((candidate) => (
                          <ResultItem
                            key={`candidate-${candidate.id}`}
                            selected={
                              selected?.type === "candidate" &&
                              selected.id === candidate.id
                            }
                            onSelect={() =>
                              setSelected({
                                type: "candidate",
                                id: candidate.id,
                              })
                            }
                            title={candidate.name}
                            subtitle={buildLocation(
                              candidate.currentCity,
                              candidate.currentState
                            )}
                            badges={buildCandidateBadges(candidate)}
                            meta={formatEnum(candidate.status)}
                            extra={
                              candidate.currentRole ||
                              "No current role provided"
                            }
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {results.elections.length > 0 && (
                    <section className="p-4">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        Elections ({results.elections.length})
                      </h3>
                      <div className="mt-3 space-y-2">
                        {results.elections.map((election) => (
                          <ResultItem
                            key={`election-${election.id}`}
                            selected={
                              selected?.type === "election" &&
                              selected.id === election.id
                            }
                            onSelect={() =>
                              setSelected({ type: "election", id: election.id })
                            }
                            title={election.position}
                            subtitle={buildLocation(
                              election.city,
                              election.state
                            )}
                            badges={buildElectionBadges(election)}
                            meta={`${election.candidateCount} candidate${
                              election.candidateCount === 1 ? "" : "s"
                            }`}
                            extra={`Election date • ${formatDate(
                              election.date
                            )}`}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[560px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detail Preview</CardTitle>
            <CardDescription>
              {selected
                ? `Expanded view for the selected ${selected.type}.`
                : "Select a record to view its details."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : detailError ? (
              <EmptyState
                primary="Unable to load detail."
                secondary={detailError}
              />
            ) : !detail ? (
              <EmptyState
                primary="Pick a candidate or election to inspect details."
                secondary="Summary, linked content, and relationships will appear here."
              />
            ) : detail.type === "candidate" ? (
              <CandidateDetailPanel
                candidate={detail.candidate}
                onToggleHidden={(nextHidden) =>
                  handleVisibilityToggle("candidate", detail.candidate.id, nextHidden)
                }
                isToggling={
                  actionPendingKey === `candidate:${detail.candidate.id}`
                }
                actionError={
                  actionError?.key === `candidate:${detail.candidate.id}`
                    ? actionError.message
                    : null
                }
              />
            ) : (
              <ElectionDetailPanel
                election={detail.election}
                onToggleHidden={(nextHidden) =>
                  handleVisibilityToggle("election", detail.election.id, nextHidden)
                }
                isToggling={
                  actionPendingKey === `election:${detail.election.id}`
                }
                actionError={
                  actionError?.key === `election:${detail.election.id}`
                    ? actionError.message
                    : null
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type ResultItemProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  badges: Array<{
    label: string;
    variant?: "outline" | "secondary" | "destructive";
  }>;
  meta: string;
  extra: string;
};

function ResultItem({
  selected,
  onSelect,
  title,
  subtitle,
  badges,
  meta,
  extra,
}: ResultItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition hover:border-primary/60 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/10"
          : "border-transparent bg-secondary/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-none">{title}</p>
          <p className="text-xs text-muted-foreground">
            {subtitle || "Location unavailable"}
          </p>
          <p className="text-xs text-muted-foreground">{extra}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide"
          >
            {meta}
          </Badge>
          <div className="flex flex-wrap justify-end gap-1">
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant ?? "secondary"}
                className="text-[11px]"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

type CandidateDetailPanelProps = {
  candidate: CandidateDetail;
  onToggleHidden: (nextHidden: boolean) => void;
  isToggling: boolean;
  actionError: string | null;
};

function CandidateDetailPanel({
  candidate,
  onToggleHidden,
  isToggling,
  actionError,
}: CandidateDetailPanelProps) {
  const createdLabel = `Created ${formatDateTime(candidate.createdAt)}`;
  const updatedLabel = `Updated ${formatDateTime(candidate.updatedAt)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{candidate.name}</h2>
          {candidate.verified && <Badge variant="secondary">Verified</Badge>}
          <Button
            type="button"
            size="sm"
            variant={candidate.hidden ? "destructive" : "green"}
            onClick={() => onToggleHidden(!candidate.hidden)}
            disabled={isToggling}
          >
            {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {candidate.hidden ? "Hidden" : "Public"}
          </Button>
          <Badge
            variant="outline"
            className="uppercase text-[11px] tracking-wide"
          >
            {formatEnum(candidate.status)}
          </Badge>
        </div>
        {actionError && (
          <p className="text-xs text-destructive">{actionError}</p>
        )}
        <p className="text-xs text-muted-foreground">Slug • {candidate.slug}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{createdLabel}</span>
          <span>{updatedLabel}</span>
          <span>Donations recorded • {candidate.donationCount}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {candidate.currentRole && (
            <Badge variant="outline">{candidate.currentRole}</Badge>
          )}
          <Badge variant="outline">
            {buildLocation(candidate.currentCity, candidate.currentState) ||
              "Location pending"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/candidate/${candidate.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" /> View public page
            </Link>
          </Button>
        </div>
      </div>

      <InfoPair label="Email" value={candidate.email || "—"} />
      <InfoPair label="Phone" value={candidate.phone || "—"} />
      <InfoPair label="Website" value={candidate.website || "—"} />
      <InfoPair label="LinkedIn" value={candidate.linkedin || "—"} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Bio</h3>
        {candidate.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {candidate.bio}
          </p>
        ) : (
          <EmptyState primary="No bio provided yet." />
        )}
      </div>

      {candidate.history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">History</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {candidate.history.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Election Links</h3>
          <span className="text-xs text-muted-foreground">
            {candidate.elections.length} linked election(s)
          </span>
        </div>
        {candidate.elections.length === 0 ? (
          <EmptyState primary="No elections associated yet." />
        ) : (
          <div className="space-y-3">
            {candidate.elections.map((link) => (
              <div key={`${link.electionId}`} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {link.election.position}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {buildLocation(link.election.city, link.election.state)} •{" "}
                      {formatDate(link.election.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge
                      variant="outline"
                      className="text-[11px] uppercase tracking-wide"
                    >
                      {formatEnum(link.election.type)}
                    </Badge>
                    {link.election.hidden && (
                      <Badge variant="destructive" className="text-[11px]">
                        Hidden election
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {link.party && <p>Party: {link.party}</p>}
                  {link.policies.length > 0 && (
                    <p>Policies: {link.policies.join(", ")}</p>
                  )}
                  {link.votinglink && (
                    <p>
                      Voting link:{" "}
                      <a
                        href={link.votinglink}
                        className="text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.votinglink}
                      </a>
                    </p>
                  )}
                  {link.additionalNotes && <p>Notes: {link.additionalNotes}</p>}
                </div>
                {link.contentBlocks.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Page preview
                    </p>
                    <ContentBlockList blocks={link.contentBlocks} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Endorsements</h3>
        {candidate.endorsements.length === 0 ? (
          <EmptyState primary="No endorsements recorded." />
        ) : (
          <ul className="space-y-2">
            {candidate.endorsements.map((endorsement) => (
              <li
                key={endorsement.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {endorsement.name || "Unnamed"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[endorsement.title, endorsement.organization]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(endorsement.createdAt)}
                  </span>
                </div>
                {endorsement.quote && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    “{endorsement.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Testimonials</h3>
        {candidate.testimonials.length === 0 ? (
          <EmptyState primary="No testimonials captured." />
        ) : (
          <ul className="space-y-2">
            {candidate.testimonials.map((testimonial) => (
              <li
                key={testimonial.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{testimonial.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rating: {testimonial.rating}/5
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(testimonial.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {testimonial.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Recent Donations</h3>
        {candidate.donations.length === 0 ? (
          <EmptyState primary="No donations recorded." />
        ) : (
          <ul className="space-y-2 text-sm">
            {candidate.donations.map((donation) => (
              <li
                key={donation.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <span>Status: {formatEnum(donation.status)}</span>
                <span>
                  {donation.amount != null
                    ? `$${donation.amount.toFixed(2)}`
                    : "Amount unavailable"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(donation.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type ElectionDetailPanelProps = {
  election: ElectionDetail;
  onToggleHidden: (nextHidden: boolean) => void;
  isToggling: boolean;
  actionError: string | null;
};

function ElectionDetailPanel({
  election,
  onToggleHidden,
  isToggling,
  actionError,
}: ElectionDetailPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{election.position}</h2>
          <Badge
            variant="outline"
            className="uppercase text-[11px] tracking-wide"
          >
            {formatEnum(election.type)}
          </Badge>
          <Button
            type="button"
            size="sm"
            variant={election.hidden ? "destructive" : "green"}
            onClick={() => onToggleHidden(!election.hidden)}
            disabled={isToggling}
          >
            {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {election.hidden ? "Hidden" : "Public"}
          </Button>
          {election.active ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          )}
        </div>
        {actionError && (
          <p className="text-xs text-destructive">{actionError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {buildLocation(election.city, election.state)} •{" "}
          {formatDate(election.date)}
        </p>
        {election.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {election.description}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Created {formatDateTime(election.createdAt)}</span>
          <span>Updated {formatDateTime(election.updatedAt)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Linked Candidates</h3>
          <span className="text-xs text-muted-foreground">
            {election.candidates.length} record(s)
          </span>
        </div>
        {election.candidates.length === 0 ? (
          <EmptyState primary="No candidates linked to this election." />
        ) : (
          <div className="space-y-3">
            {election.candidates.map((link) => (
              <div key={link.candidateId} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {link.candidate.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.candidate.slug} •{" "}
                      {link.candidate.verified ? "Verified" : "Unverified"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {link.candidate.hidden && (
                      <Badge variant="destructive">Hidden</Badge>
                    )}
                    {link.party && (
                      <Badge variant="outline">{link.party}</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {link.policies.length > 0 && (
                    <p>Policies: {link.policies.join(", ")}</p>
                  )}
                  {link.votinglink && (
                    <p>
                      Voting link:{" "}
                      <a
                        href={link.votinglink}
                        className="text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.votinglink}
                      </a>
                    </p>
                  )}
                  {link.additionalNotes && <p>Notes: {link.additionalNotes}</p>}
                  {link.sources.length > 0 && (
                    <p>Sources: {link.sources.join(", ")}</p>
                  )}
                </div>
                {link.contentBlocks.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Candidate section preview
                    </p>
                    <ContentBlockList blocks={link.contentBlocks} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentBlockList({ blocks }: { blocks: ContentBlockPreview[] }) {
  const ordered = useMemo(
    () => [...blocks].sort((a, b) => a.order - b.order).slice(0, 6),
    [blocks]
  );

  if (ordered.length === 0) {
    return <EmptyState primary="No custom content." />;
  }

  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      {ordered.map((block) => {
        switch (block.type) {
          case "HEADING": {
            const Tag = block.level === 1 ? "h4" : "h5";
            return (
              <Tag key={block.id} className="font-semibold text-foreground">
                {block.text}
              </Tag>
            );
          }
          case "TEXT":
            return (
              <p key={block.id} className="leading-relaxed whitespace-pre-line">
                {block.body}
              </p>
            );
          case "LIST":
            return (
              <ul
                key={block.id}
                className={cn(
                  "pl-5",
                  block.listStyle === "NUMBER" ? "list-decimal" : "list-disc"
                )}
              >
                {block.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            );
          case "DIVIDER":
            return <hr key={block.id} className="border-border" />;
          case "IMAGE":
            return (
              <div
                key={block.id}
                className="rounded-md border border-dashed p-3 text-xs"
              >
                <p className="font-medium">Image block</p>
                <p className="truncate text-muted-foreground">
                  {block.imageUrl || "No image URL provided."}
                </p>
                {block.caption && (
                  <p className="mt-1 italic">Caption: {block.caption}</p>
                )}
              </div>
            );
          case "VIDEO":
            return (
              <div
                key={block.id}
                className="rounded-md border border-dashed p-3 text-xs"
              >
                <p className="font-medium">Video block</p>
                <p className="truncate text-muted-foreground">
                  {block.videoUrl || "No video URL provided."}
                </p>
                {block.caption && (
                  <p className="mt-1 italic">Caption: {block.caption}</p>
                )}
              </div>
            );
          default:
            return (
              <p key={block.id} className="italic">
                Unsupported block type ({block.type})
              </p>
            );
        }
      })}
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="min-w-[120px] font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function buildCandidateBadges(candidate: CandidateSummary) {
  const badges: Array<{
    label: string;
    variant?: "outline" | "secondary" | "destructive";
  }> = [];
  if (candidate.verified)
    badges.push({ label: "Verified", variant: "secondary" });
  if (candidate.hidden)
    badges.push({ label: "Hidden", variant: "destructive" });
  candidate.elections.slice(0, 2).forEach((election) => {
    badges.push({ label: election.position, variant: "outline" });
  });
  return badges;
}

function buildElectionBadges(election: ElectionSummary) {
  const badges: Array<{
    label: string;
    variant?: "outline" | "secondary" | "destructive";
  }> = [];
  badges.push({ label: formatEnum(election.electionType), variant: "outline" });
  if (election.hidden) badges.push({ label: "Hidden", variant: "destructive" });
  election.sampleCandidates.slice(0, 2).forEach((candidate) => {
    badges.push({
      label: candidate.name,
      variant: candidate.verified ? "secondary" : "outline",
    });
  });
  return badges;
}

function buildLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ");
}

function formatDate(iso: string) {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return dateTimeFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatEnum(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .toString()
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
