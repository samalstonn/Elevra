"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CandidateImage } from "@/components/CandidateImage";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Camera,
  Compass,
  GraduationCap,
  HeartHandshake,
  LifeBuoy,
  Megaphone,
  Rss,
  Search,
  Sparkles,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TabKey = "feed" | "search" | "profile";

type FeedEvent = {
  id: number;
  type: "BIO" | "EDUCATION" | "PHOTO" | "CAMPAIGN";
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  candidate: {
    id: number;
    name: string;
    slug: string;
    currentRole?: string | null;
    currentCity?: string | null;
    currentState?: string | null;
    photo?: string | null;
    verified?: boolean | null;
  };
};

type FollowingItem = {
  candidateId: number;
  followedAt: string;
  candidate: FeedEvent["candidate"];
};

type PreferencesState = {
  emailMode: "IMMEDIATE" | "DAILY_DIGEST" | "OFF";
  notifyBio: boolean;
  notifyEducation: boolean;
  notifyPhoto: boolean;
  notifyCampaign: boolean;
  dailyDigestHour: number | null;
};

type Donation = {
  id: number;
  amount: number;
  paidAt: string | null;
  candidate: {
    id: number;
    name: string;
    party?: string | null;
    position?: string | null;
    city?: string | null;
    state?: string | null;
    slug: string;
  };
};

type DashboardProps = {
  user: {
    firstName: string | null;
    username: string | null;
    imageUrl: string;
  };
  data: {
    totalDonations: number;
    totalCandidatesSupported: number;
    donations: Donation[];
  };
  isVoter: boolean;
};

type SearchResults = {
  candidates: Array<{
    id: number;
    name: string;
    slug: string;
    currentRole?: string | null;
    currentCity?: string | null;
    currentState?: string | null;
    photo?: string | null;
    verified?: boolean | null;
  }>;
  elections: Array<{
    id: number;
    position: string;
    city: string;
    state: string;
    date: string;
  }>;
};

const DEFAULT_PREFS: PreferencesState = {
  emailMode: "IMMEDIATE",
  notifyBio: true,
  notifyEducation: true,
  notifyPhoto: true,
  notifyCampaign: true,
  dailyDigestHour: 8,
};

const EMAIL_MODE_LABELS: Record<PreferencesState["emailMode"], string> = {
  IMMEDIATE: "Immediate",
  DAILY_DIGEST: "Daily digest",
  OFF: "Off",
};

const DIGEST_HOUR_OPTIONS = [
  { value: 8, label: "Morning (8 AM)" },
  { value: 12, label: "Midday (12 PM)" },
  { value: 18, label: "Evening (6 PM)" },
];

export default function DashboardPageClient({
  user,
  data,
  isVoter,
}: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("feed");
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFS);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults>({
    candidates: [],
    elections: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const greetingName = user.firstName || user.username || "there";

  const refreshFeed = useCallback(async () => {
    if (!isVoter) {
      return;
    }
    try {
      const response = await fetchJSON<{ events: FeedEvent[] }>("/api/voter/feed");
      setFeed(response.events);
    } catch (error) {
      console.error("Failed to refresh voter feed", error);
    }
  }, [isVoter]);

  useEffect(() => {
    if (!isVoter) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setFeedLoading(true);
        const [feedRes, followRes, prefsRes] = await Promise.all([
          fetchJSON<{ events: FeedEvent[] }>("/api/voter/feed"),
          fetchJSON<{ follows: FollowingItem[] }>("/api/voter/following"),
          fetchJSON<{ preferences: PreferencesState }>("/api/voter/preferences"),
        ]);
        if (cancelled) return;
        setFeed(feedRes.events);
        setFollowing(followRes.follows);
        setPreferences((prev) => ({
          ...prev,
          ...prefsRes.preferences,
        }));
      } catch (error) {
        console.error("Failed to load voter dashboard", error);
      } finally {
        if (!cancelled) {
          setFeedLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isVoter]);

  useEffect(() => {
    if (!isVoter) {
      return;
    }
    const interval = window.setInterval(() => {
      void refreshFeed();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isVoter, refreshFeed]);

  useEffect(() => {
    if (!isVoter) return;
    if (!searchQuery) {
      setSearchResults({ candidates: [], elections: [] });
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const results = await fetchJSON<SearchResults>(
          `/api/voter/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        setSearchResults(results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Search failed", error);
          setSearchError("Search is temporarily unavailable. Please try again.");
        }
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [searchQuery, isVoter]);

  const tabs = useMemo(
    () => [
      { key: "feed" as const, label: "Feed", icon: Rss },
      { key: "search" as const, label: "Search", icon: Search },
      { key: "profile" as const, label: "Profile", icon: UserCircle },
    ],
    []
  );

  const handlePreferenceUpdate = useCallback(
    async (next: PreferencesState) => {
      setPreferences(next);
      setPreferencesSaving(true);
      try {
        await fetch("/api/voter/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailMode: mapEmailMode(next.emailMode),
            notifyBio: next.notifyBio,
            notifyEducation: next.notifyEducation,
            notifyPhoto: next.notifyPhoto,
            notifyCampaign: next.notifyCampaign,
            dailyDigestHour: next.dailyDigestHour,
          }),
        });
      } catch (error) {
        console.error("Failed to update preferences", error);
      } finally {
        setPreferencesSaving(false);
      }
    },
    []
  );

  const togglePreference = useCallback(
    (key: keyof Omit<PreferencesState, "emailMode" | "dailyDigestHour">) => {
      handlePreferenceUpdate({
        ...preferences,
        [key]: !preferences[key],
      });
    },
    [handlePreferenceUpdate, preferences]
  );

  const handleModeChange = useCallback(
    (mode: PreferencesState["emailMode"]) => {
      if (mode === preferences.emailMode) return;
      handlePreferenceUpdate({
        ...preferences,
        emailMode: mode,
      });
    },
    [handlePreferenceUpdate, preferences]
  );

  const handleDigestHourChange = useCallback(
    (value: string) => {
      const hour = Number(value);
      handlePreferenceUpdate({
        ...preferences,
        dailyDigestHour: Number.isNaN(hour) ? null : hour,
      });
    },
    [handlePreferenceUpdate, preferences]
  );

  if (!isVoter) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <Card className="w-full bg-purple-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-purple-700">
              Unlock the voter dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Follow candidates, receive notifications, and build your personalized voter feed by switching your role to voter.
            </p>
            <Button
              variant="purple"
              onClick={() => router.push("/sign-up?role=voter&redirect=/dashboard")}
            >
              I&apos;m a voter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 pb-28 pt-8 md:pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-purple-500">
            Your voter hub
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Welcome back, {greetingName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay close to the campaigns you care about with live updates, notifications, and quick search.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="hidden items-center gap-3 rounded-full border border-purple-100 bg-white/70 px-4 py-2 shadow-sm md:flex"
        >
          <LifeBuoy className="h-4 w-4 text-purple-500" />
          <span className="text-sm text-muted-foreground">
            Following <strong className="text-purple-600">{following.length}</strong> campaigns
          </span>
        </motion.div>
      </header>

      <div className="mt-8 hidden rounded-full border border-purple-100 bg-white/60 p-1 shadow-sm backdrop-blur-md md:flex md:w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === key
                ? "bg-purple-500 text-white shadow"
                : "text-muted-foreground hover:text-purple-500"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <main className="mt-6 space-y-10">
        {activeTab === "feed" && (
          <section aria-labelledby="voter-feed-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="voter-feed-heading" className="text-xl font-semibold text-gray-900">
                Activity feed
              </h2>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Live
              </Badge>
            </div>
            {feedLoading ? (
              <LoadingPlaceholder message="Fetching latest campaign updates" />
            ) : feed.length === 0 ? (
              <EmptyState
                icon={<HeartHandshake className="h-5 w-5 text-purple-500" />}
                title="Follow a candidate to get started"
                description="Your feed is empty. Visit candidate profiles and tap Follow to collect updates here."
                action={{
                  label: "Explore candidates",
                  onClick: () => setActiveTab("search"),
                }}
              />
            ) : (
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute left-5 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-purple-200 via-purple-100 to-transparent sm:block"
                />
                <div className="space-y-5 sm:pl-4">
                  {feed.map((item, index) => (
                    <FeedCard key={item.id} event={item} index={index} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "search" && (
          <section aria-labelledby="voter-search-heading">
            <div className="mb-4">
              <h2 id="voter-search-heading" className="text-xl font-semibold text-gray-900">
                Search voters & elections
              </h2>
              <p className="text-sm text-muted-foreground">
                Type to discover campaigns by name, office, or location.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Find candidates or elections"
                className="w-full pl-9"
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(event.target.value)
                }
                data-testid="search-input"
              />
            </div>
            <div className="mt-6 space-y-6">
              {searchLoading ? (
                <LoadingPlaceholder message="Searching the voter network" />
              ) : searchError ? (
                <ErrorState message={searchError} />
              ) : searchQuery ? (
                <SearchResultsList results={searchResults} />
              ) : (
                <EmptyState
                  icon={<Compass className="h-5 w-5 text-purple-500" />}
                  title="Start typing to explore"
                  description="Search for candidates or elections by name, office, or location."
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section aria-labelledby="voter-profile-heading">
            <h2 id="voter-profile-heading" className="mb-6 text-xl font-semibold text-gray-900">
              Your voter profile
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-purple-50 via-white to-purple-100">
                <CardHeader>
                  <CardTitle className="text-purple-700">Impact snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-white/80 p-4 shadow">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Total contributions
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ${data.totalDonations.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <HeartHandshake className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/80 p-4 shadow">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Candidates supported
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {data.totalCandidatesSupported}
                      </p>
                    </div>
                    <UserCircle className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/80 p-4 shadow">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Local impact score
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {(data.totalDonations * 0.01).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}%
                      </p>
                    </div>
                    <LifeBuoy className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(EMAIL_MODE_LABELS) as Array<PreferencesState["emailMode"]>).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleModeChange(mode)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition",
                          preferences.emailMode === mode
                            ? "border-purple-500 bg-purple-50 text-purple-700 shadow"
                            : "border-border text-muted-foreground hover:border-purple-200"
                        )}
                      >
                        {EMAIL_MODE_LABELS[mode]}
                      </button>
                    ))}
                  </div>

                  {preferences.emailMode === "DAILY_DIGEST" ? (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Delivery window
                      </Label>
                      <Select
                        value={String(preferences.dailyDigestHour ?? 8)}
                        onValueChange={handleDigestHourChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIGEST_HOUR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <PreferenceToggle
                      id="notify-bio"
                      label="Bio updates"
                      description="Get notified when candidates refresh their biography"
                      checked={preferences.notifyBio}
                      onCheckedChange={() => togglePreference("notifyBio")}
                    />
                    <PreferenceToggle
                      id="notify-education"
                      label="Education updates"
                      description="Stay informed about education and experience additions"
                      checked={preferences.notifyEducation}
                      onCheckedChange={() => togglePreference("notifyEducation")}
                    />
                    <PreferenceToggle
                      id="notify-photo"
                      label="Photo updates"
                      description="Know when profile imagery gets refreshed"
                      checked={preferences.notifyPhoto}
                      onCheckedChange={() => togglePreference("notifyPhoto")}
                    />
                    <PreferenceToggle
                      id="notify-campaign"
                      label="Campaign page updates"
                      description="Track platform and policy changes"
                      checked={preferences.notifyCampaign}
                      onCheckedChange={() => togglePreference("notifyCampaign")}
                    />
                  </div>
                  {preferencesSaving ? (
                    <p className="text-xs text-muted-foreground">Saving preferences…</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.donations.length === 0 ? (
                    <EmptyState
                      icon={<HeartHandshake className="h-5 w-5 text-purple-500" />}
                      title="No donations yet"
                      description="Support your favorite campaigns directly from candidate profiles."
                    />
                  ) : (
                    <div className="space-y-3">
                      {data.donations.slice(0, 6).map((donation) => (
                        <div
                          key={donation.id}
                          className="flex flex-col gap-1 rounded-xl border border-purple-100 bg-white/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {donation.candidate.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Number(donation.amount).toLocaleString(undefined, {
                                style: "currency",
                                currency: "USD",
                              })}
                              {donation.candidate.position
                                ? ` • ${donation.candidate.position}`
                                : ""}
                              {donation.candidate.city && donation.candidate.state
                                ? ` • ${donation.candidate.city}, ${donation.candidate.state}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {donation.paidAt
                                ? formatDistanceToNow(new Date(donation.paidAt), { addSuffix: true })
                                : "Pending"}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/candidate/${donation.candidate.slug}`}>
                                View campaign
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Following</CardTitle>
                </CardHeader>
                <CardContent>
                  {following.length === 0 ? (
                    <EmptyState
                      icon={<Rss className="h-5 w-5 text-purple-500" />}
                      title="You&apos;re not following anyone yet"
                      description="Tap Follow on candidate profiles to build your watchlist."
                    />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {following.map((item) => (
                        <div
                          key={item.candidateId}
                          className="flex items-center gap-3 rounded-xl border border-purple-100 bg-white/80 p-4 shadow-sm"
                        >
                          <CandidateImage
                            clerkUserId={null}
                            publicPhoto={item.candidate.photo ?? undefined}
                            name={item.candidate.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.candidate.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.candidate.currentRole || "Campaign"}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/candidate/${item.candidate.slug}`}>View</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed inset-x-4 bottom-4 z-50 flex justify-center md:hidden">
        <div className="flex w-full max-w-xl items-center justify-around rounded-3xl border border-purple-100 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
                activeTab === key ? "text-purple-600" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function FeedCard({ event, index }: { event: FeedEvent; index: number }) {
  const summary = extractSummary(event.metadata);
  const highlights = extractHighlights(event.metadata);
  const typeMeta = getFeedTypeMeta(event.type);
  const timeAgo = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });
  const location = [event.candidate.currentCity, event.candidate.currentState]
    .filter(Boolean)
    .join(", ");
  const TypeIcon = typeMeta.icon;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      className="relative overflow-hidden rounded-3xl border border-purple-100/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:pl-16"
      data-testid="feed-item"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-6 top-8 hidden h-3 w-3 rounded-full border-4 border-white shadow-[0_0_0_2px_rgba(168,85,247,0.15)] sm:block",
          typeMeta.dotClass
        )}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CandidateImage
              clerkUserId={null}
              publicPhoto={event.candidate.photo ?? undefined}
              name={event.candidate.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl border border-purple-100 bg-purple-50/40 object-cover shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-gray-900">{event.candidate.name}</p>
                {event.candidate.verified ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {event.candidate.currentRole || "Campaign"} • {timeAgo}
              </p>
              {location ? (
                <p className="text-xs text-muted-foreground">{location}</p>
              ) : null}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 border-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
              typeMeta.badgeClass
            )}
          >
            <TypeIcon className="h-3.5 w-3.5" />
            {typeMeta.label}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-gray-700">{summary}</p>
        {highlights.length ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            Captured {new Date(event.createdAt).toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="self-start gap-1 text-purple-600 hover:text-purple-700"
            asChild
          >
            <Link href={`/candidate/${event.candidate.slug}`}>
              View profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function LoadingPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center text-sm text-muted-foreground">
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-purple-400 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <p>{message}…</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70">
        {icon}
      </div>
      <p className="text-base font-medium text-gray-900">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button variant="purple" onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-sm text-red-700">
      {message}
    </div>
  );
}

function SearchResultsList({ results }: { results: SearchResults }) {
  const router = useRouter();
  const hasCandidates = results.candidates.length > 0;
  const hasElections = results.elections.length > 0;

  if (!hasCandidates && !hasElections) {
    return (
      <EmptyState
        icon={<Search className="h-5 w-5 text-purple-500" />}
        title="No matches found"
        description="Try another name, role, or city."
      />
    );
  }

  return (
    <div className="space-y-6">
      {hasCandidates ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-500">
            Candidates
          </h3>
          <div className="space-y-3">
            {results.candidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white/80 p-4 text-left shadow-sm transition hover:border-purple-300"
                onClick={() => router.push(`/candidate/${candidate.slug}`)}
                data-testid="search-result-item"
              >
                <div className="flex items-center gap-3">
                  <CandidateImage
                    clerkUserId={null}
                    publicPhoto={candidate.photo ?? undefined}
                    name={candidate.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.currentRole || "Campaign"}
                    </p>
                  </div>
                </div>
                {candidate.verified ? (
                  <Badge variant="outline" className="border-purple-200 text-purple-600">
                    Verified
                  </Badge>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {hasElections ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-500">
            Elections
          </h3>
          <div className="space-y-3">
            {results.elections.map((election) => (
              <div
                key={election.id}
                className="rounded-2xl border border-purple-100 bg-white/80 p-4 shadow-sm"
              >
                <p className="font-medium text-gray-900">{election.position}</p>
                <p className="text-xs text-muted-foreground">
                  {election.city}, {election.state} • {new Date(election.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white/80 p-3 transition hover:border-purple-200"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function extractSummary(metadata?: Record<string, unknown> | null) {
  if (metadata && typeof metadata.summary === "string") {
    return metadata.summary;
  }
  return "Campaign update posted.";
}

function extractHighlights(metadata?: Record<string, unknown> | null) {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const highlights: string[] = [];
  const {
    role,
    city,
    state,
    previousLength,
    nextLength,
  } = metadata as Partial<{
    role: unknown;
    city: unknown;
    state: unknown;
    previousLength: unknown;
    nextLength: unknown;
  }>;

  if (typeof role === "string" && role.trim()) {
    highlights.push(`New role: ${role.trim()}`);
  }

  const locationParts = [
    typeof city === "string" ? city.trim() : "",
    typeof state === "string" ? state.trim() : "",
  ].filter(Boolean);
  if (locationParts.length) {
    highlights.push(`Now representing ${locationParts.join(", ")}`);
  }

  if (typeof previousLength === "number" && typeof nextLength === "number" && previousLength !== nextLength) {
    const delta = nextLength - previousLength;
    const direction = delta > 0 ? "grew" : "shrunk";
    highlights.push(`Bio ${direction} by ${Math.abs(delta)} characters`);
  }

  return highlights;
}

type FeedTypeMeta = {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: LucideIcon;
};

const FEED_TYPE_META: Record<FeedEvent["type"], FeedTypeMeta> = {
  BIO: {
    label: "Bio Update",
    badgeClass: "bg-rose-50 text-rose-600 shadow-[0_1px_0_rgba(244,114,182,0.2)]",
    dotClass: "bg-rose-500",
    icon: Sparkles,
  },
  EDUCATION: {
    label: "Education Update",
    badgeClass: "bg-amber-50 text-amber-600 shadow-[0_1px_0_rgba(251,191,36,0.25)]",
    dotClass: "bg-amber-500",
    icon: GraduationCap,
  },
  PHOTO: {
    label: "New Photo",
    badgeClass: "bg-sky-50 text-sky-600 shadow-[0_1px_0_rgba(14,165,233,0.2)]",
    dotClass: "bg-sky-500",
    icon: Camera,
  },
  CAMPAIGN: {
    label: "Campaign Update",
    badgeClass: "bg-purple-50 text-purple-700 shadow-[0_1px_0_rgba(168,85,247,0.2)]",
    dotClass: "bg-purple-500",
    icon: Megaphone,
  },
};

function getFeedTypeMeta(type: FeedEvent["type"]): FeedTypeMeta {
  return FEED_TYPE_META[type] ?? FEED_TYPE_META.CAMPAIGN;
}

function mapEmailMode(mode: PreferencesState["emailMode"]) {
  switch (mode) {
    case "IMMEDIATE":
      return "immediate";
    case "DAILY_DIGEST":
      return "daily_digest";
    case "OFF":
    default:
      return "off";
  }
}
