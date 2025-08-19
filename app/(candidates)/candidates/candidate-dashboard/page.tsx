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
import { Eye, Edit, Mail, HandCoins } from "lucide-react"; // Icons
import { FaShare } from "react-icons/fa"; // Importing FaShare
import { Candidate, Donation } from "@prisma/client";
import { useCandidate } from "@/lib/useCandidate";
import AnalyticsChart from "@/components/AnalyticsChart";
import ViewsHeatmap from "@/components/ViewsHeatmap";

export type CandidateWithDonations = Candidate & { donations: Donation[] };

export default function OverviewPage() {
  const [profileViews, setProfileViews] = useState<number | string>(
    "Please create a campaign to have a visible profile"
  );
  const [donationTotal, _] = useState<number | string>("Loading...");
  const { data: candidate } = useCandidate();

  useEffect(() => {
    if (!candidate) return;
    // Remove old single count fetch; replaced by timeseries aggregate via chart callback
  }, [candidate]);

  return (
    <div className="space-y-6">
      {/* Feature interest banner */}
      <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs md:text-sm p-3 md:p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm">
        <div className="flex-1 leading-snug">
          Curious about Mailing List Subscribers or Donation analytics? 📨💸
          <br className="hidden md:block" />
          If you’d like early access (or have ideas), let us know; we’re
          building this with you.
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/feedback"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs md:text-sm font-medium hover:bg-purple-700 transition"
          >
            Share Feedback
          </Link>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

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
      <Card>
        <CardHeader>
          <CardTitle>Time-of-Day Activity</CardTitle>
          <CardDescription>
            When people view your profile (local time).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidate ? (
            <ViewsHeatmap candidateId={candidate.id} days={30} />
          ) : (
            <div className="text-xs text-gray-500">Loading heatmap...</div>
          )}
        </CardContent>
      </Card>
      {/* Analytics Card */}
      {/* <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Profile Activity</CardTitle>
          <CardDescription>
            Profile views and engagement metrics for the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <AnalyticsChart />
        </CardContent>
      </Card> */}

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
