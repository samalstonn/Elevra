"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Eye,
  Edit,
  Mail,
  HandCoins,
  RefreshCcw,
  CreditCard,
} from "lucide-react"; // Icons
import { FaShare } from "react-icons/fa"; // Importing FaShare
import { Candidate, Donation } from "@prisma/client";
import { useCandidate } from "@/lib/useCandidate";
import AnalyticsChart from "@/components/AnalyticsChart";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaCheckCircle } from "react-icons/fa";
import TourModal from "@/components/tour/TourModal";
import { usePageTitle } from "@/lib/usePageTitle";
import { buildEditorPath } from "./my-elections/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import ResultsSearchBar from "@/components/ResultsSearchBar";

export type CandidateWithDonations = Candidate & { donations: Donation[] };

export default function OverviewPage() {
  usePageTitle("Candidate Dashboard – Overview");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const _verifiedSlug = searchParams.get("slug");
  const [profileViews, setProfileViews] = useState<number | string>(
    "Please create a campaign to have a visible profile"
  );
  const [donationTotal, _] = useState<number | string>("Loading...");
  const { data: candidate, electionLinks } = useCandidate();
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  // Tour state
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOptOut, setShowOptOut] = useState(false);
  const [showStep1, setShowStep1] = useState(false);
  const [pendingWelcome, setPendingWelcome] = useState(false);
  const isPremium =
    user?.publicMetadata.candidateSubscriptionTier === "premium";

  useEffect(() => {
    if (!candidate) return;
    // Remove old single count fetch; replaced by timeseries aggregate via chart callback
  }, [candidate]);

  // First-visit Welcome via Clerk metadata (always on first dashboard visit)
  useEffect(() => {
    if (!isLoaded || !user) return;
    const visited = Boolean(
      (user.publicMetadata as Record<string, unknown>)
        ?.visitedCandidateDashboard === true
    );
    if (visited) return;
    const verifiedParam = searchParams.get("verified");
    if (verifiedParam === "1") {
      // Queue welcome to show after verified popup is closed
      setPendingWelcome(true);
      return;
    }
    // No verification banner; show welcome immediately and mark visited
    setShowWelcome(true);
    (async () => {
      try {
        await fetch("/api/user/metadata/visited-dashboard", { method: "POST" });
      } catch (_e) {
        console.error("Failed to persist visitedDashboard via API", _e);
      }
    })();
  }, [isLoaded, user, searchParams]);

  // Show verification success popup when returning with ?verified=1
  useEffect(() => {
    const verifiedFlag = searchParams.get("verified");
    if (verifiedFlag === "1") {
      try {
        const hide = localStorage.getItem("elevra_hide_verified_onboarding");
        if (hide !== "1") {
          // Ensure tour welcome doesn't overlap
          setShowWelcome(false);
          setShowVerifiedModal(true);
        }
      } catch {
        // no-op if window/URL not available
      }
    }
  }, [searchParams, user]);

  const clearVerifiedQuery = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  // Resume tour (Step 1) when returning to Overview
  useEffect(() => {
    try {
      const step = localStorage.getItem("elevra_tour_step");
      const tourOptOut = localStorage.getItem("elevra_tour_opt_out");
      if (tourOptOut === "1") return;
      if (showVerifiedModal || showWelcome) return;
      if (step === "1") setShowStep1(true);
    } catch {}
  }, [showVerifiedModal, showWelcome]);

  // After verified modal closes, if welcome was pending for first-time users, show it and set metadata
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!showVerifiedModal && pendingWelcome) {
      setShowWelcome(true);
      (async () => {
        try {
          await fetch("/api/user/metadata/visited-dashboard", {
            method: "POST",
          });
        } catch (e) {
          console.error("Failed to persist visitedDashboard after verified", e);
        }
      })();
      setPendingWelcome(false);
    }
  }, [showVerifiedModal, pendingWelcome, isLoaded, user]);

  const handleWelcomeStart = () => {
    try {
      localStorage.setItem("elevra_tour_step", "1");
    } catch {}
    setShowWelcome(false);
    setShowStep1(true);
  };
  const handleWelcomeOptOut = () => {
    try {
      localStorage.setItem("elevra_tour_opt_out", "1");
      localStorage.removeItem("elevra_tour_step");
    } catch {}
    setShowWelcome(false);
    setShowOptOut(true);
  };
  const skipTour = () => {
    try {
      localStorage.setItem("elevra_tour_opt_out", "1");
      localStorage.removeItem("elevra_tour_step");
    } catch {}
    setShowStep1(false);
    setShowOptOut(true);
  };
  const nextToProfile = () => {
    try {
      localStorage.setItem("elevra_tour_step", "2");
    } catch {}
    setShowStep1(false);
    router.push("/candidates/candidate-dashboard/my-profile?tour=1");
  };
  const backToWelcome = () => {
    // Go back to the welcome screen
    setShowStep1(false);
    setShowWelcome(true);
  };

  const restartTour = () => {
    try {
      localStorage.removeItem("elevra_tour_opt_out");
      localStorage.setItem("elevra_tour_step", "1");
    } catch {}
    // Close any other tour state and open Step 1 here
    setShowOptOut(false);
    setShowWelcome(false);
    setShowStep1(true);
  };

  return (
    <div className="space-y-6">
      {/* Tour: Welcome */}
      <TourModal
        open={showWelcome}
        onOpenChange={setShowWelcome}
        title="Welcome to Your Candidate Dashboard!"
        primaryLabel="Let’s Go!"
        onPrimary={handleWelcomeStart}
        secondaryLabel="Don’t show again"
        onSecondary={handleWelcomeOptOut}
      >
        <p>
          Nice to have you here,{" "}
          {user?.firstName || user?.username || "Candidate"}. We prepared a
          quick tour to help you get started. It will help you set up your
          profile, manage campaigns, and engage with voters. It only takes a few
          minutes!
        </p>
      </TourModal>

      {/* Tour: Opt-out friendly confirmation */}
      <TourModal
        open={showOptOut}
        onOpenChange={setShowOptOut}
        title="Tour Skipped"
        primaryLabel="Close"
        onPrimary={() => setShowOptOut(false)}
      >
        <p>Seems like you’re already an expert — well done!</p>
        <p>
          If you ever want a refresher, just click the{" "}
          <strong>Restart Tour</strong> button at the bottom of the{" "}
          <strong>Overview</strong> page!
        </p>
        <p>
          Need anything else? Email <strong>team@elevracommunity.com</strong>{" "}
          anytime or click <strong>Contact Us</strong> in the footer of each
          page!
        </p>
      </TourModal>

      {/* Tour: Step 1 (Overview) */}
      <TourModal
        open={showStep1}
        onOpenChange={setShowStep1}
        title="Overview (Step 1 of 3)"
        backLabel="Back"
        onBack={backToWelcome}
        primaryLabel="Next: Profile"
        onPrimary={nextToProfile}
        secondaryLabel="Skip tour"
        onSecondary={skipTour}
      >
        <p>See profile views and quick actions to manage your campaign.</p>
        <p>
          Tip: Feel free to drag and drop this window anywhere on the screen!
          Scroll the background to explore your dashboard while keeping this
          guide handy.
        </p>
      </TourModal>
      <Dialog open={showVerifiedModal} onOpenChange={setShowVerifiedModal}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              You’re Verified on Elevra!
            </DialogTitle>
          </DialogHeader>
          <div className="text-left text-gray-700 text-sm space-y-4 leading-relaxed">
            <p>
              Your candidate profile is live and discoverable to voters. Welcome
              aboard!
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>You have a verified badge</strong> beside your name —
                verified candidates show up higher in search.
              </li>
            </ul>
            {electionLinks && electionLinks.length > 0 && (
              <p>
                Your campaign is now active for{" "}
                <strong>
                  {electionLinks
                    .map((l) => {
                      const { position, city, state } = l.election || {};
                      let result = position || "";
                      if (city) result += ` in ${city}`;
                      if (state) result += `, ${state}`;
                      return result;
                    })
                    .filter(Boolean)
                    .join("; ")}
                </strong>
                . Visit the{" "}
                <Link
                  href="/candidates/candidate-dashboard/my-elections"
                  className="text-purple-600 underline"
                >
                  Campaign tab
                </Link>{" "}
                on the left to update your election details and customize your
                public page. Prefer to jump straight into editing? Open the{" "}
                <Link
                  href={
                    candidate
                      ? buildEditorPath(
                          candidate.slug,
                          electionLinks[0].electionId
                        )
                      : "/candidates/candidate-dashboard/my-elections"
                  }
                  className="text-purple-600 underline"
                >
                  campaign editor
                </Link>
                .
              </p>
            )}
            <p>
              You’re ready to engage with voters on Elevra! Please let us know
              at team@elevracommunity.com what features are important to you.
            </p>
            <p>
              We’d love your feedback — reply to your onboarding email or
              contact us anytime with ideas or questions.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  localStorage.setItem("elevra_hide_verified_onboarding", "1");
                } catch {
                  // ignore storage errors
                }
                setShowVerifiedModal(false);
                clearVerifiedQuery();
              }}
            >
              Don’t show again
            </Button>
            <Button
              variant="purple"
              onClick={() => {
                setShowVerifiedModal(false);
                clearVerifiedQuery();
              }}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {typeof profileViews === "string" ? (
              <div className="text-xs text-gray-500 font-normal leading-snug">
                {profileViews}
              </div>
            ) : (
              <div className="text-2xl font-bold">{profileViews}</div>
            )}
            {/* <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>{" "} */}
            {/* Placeholder change */}
          </CardContent>
        </Card>
        <Card className="opacity-50 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mailing List Subscribers
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon...</p>{" "}
            {/* Placeholder change */}
          </CardContent>
        </Card>
        <Card className="opacity-50 bg-gray-50">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donations
            </CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Use correct icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {typeof donationTotal === "number"
                ? donationTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : donationTotal}
            </div>
            <p className="text-xs text-muted-foreground">Coming soon...</p>{" "}
          </CardContent>
        </Card>
      </div>
      {/* Profile Views Time Series */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Views Over Time</CardTitle>
          <CardDescription>Daily views for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {candidate ? (
            <AnalyticsChart
              candidateId={candidate.id}
              days={30}
              onDataLoaded={({ total }) => setProfileViews(total)}
            />
          ) : (
            <div className="text-xs text-gray-500">Loading candidate...</div>
          )}
        </CardContent>
      </Card>
      {!isPremium && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <CreditCard className="h-4 w-4 !text-blue-800" />{" "}
          {/* Ensure icon color matches */}
          <AlertTitle>Unlock Advanced Analytics</AlertTitle>
          <AlertDescription>
            Gain deeper insights into profile engagement, reach, and more.
            <Link
              href="/candidates/candidate-dashboard/upgrade"
              className="font-semibold underline ml-2 hover:text-blue-900"
            >
              Upgrade Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your campaign essentials.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" asChild>
            <Link href="/candidates/candidate-dashboard/my-profile">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
          <Button variant="purple" asChild>
            <Link
              href={candidate ? `/candidate/${candidate.slug}` : "/candidates"}
            >
              <Eye className="mr-2 h-4 w-4" /> View Public Profile
            </Link>
          </Button>
          <Button
            variant="purple"
            onClick={async () => {
              if (!candidate) return;

              const url = `${window.location.origin}/candidate/${candidate.slug}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: `Check out ${candidate.name}'s campaign on Elevra!`,
                    url,
                  });
                } catch (error) {
                  console.error("Error sharing:", error);
                }
              } else {
                navigator.clipboard.writeText(url);
                alert("Profile link copied to clipboard!");
              }
            }}
          >
            <FaShare className="mr-2 h-4 w-4" /> Share My Profile
          </Button>
          <Button variant="outline" onClick={restartTour}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Restart Tour
          </Button>
          {/* <Button variant="outline" asChild>
            <Link href="/candidates/candidate-dashboard/analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
            </Link>
          </Button> */}
          {/* <Button variant="outline" asChild>
            <Link href="/candidates/candidate-dashboard/mailing-lists">
              <Mail className="mr-2 h-4 w-4" /> Manage Mailing Lists
            </Link>
          </Button> */}
        </CardContent>
      </Card>

      {/* Placeholder for Recent Activity or Notifications */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No recent activity to display.
          </p>
        </CardContent>
      </Card> */}
    </div>
  );
}
