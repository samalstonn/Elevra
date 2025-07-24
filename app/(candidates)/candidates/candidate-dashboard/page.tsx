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
import { useAuth } from "@clerk/nextjs";
import { Candidate, Donation } from "@prisma/client";
import { useCandidate } from "@/lib/useCandidate";
// import AnalyticsChart from "@/components/AnalyticsChart";

export type CandidateWithDonations = Candidate & { donations: Donation[] };

export default function OverviewPage() {
  const [profileViews, setProfileViews] = useState<number | string>(
    "Loading..."
  );
  const [donationTotal, setDonationTotal] = useState<number | string>(
    "Loading..."
  );
  const { userId } = useAuth();
  const { data: candidate, error, isLoading, refresh } = useCandidate();

  useEffect(() => {
    if (!candidate) return;
    console.log(`Fetching profile views for candidate ID: ${candidate.id}`);
    fetch(`/api/candidateViews?candidateID=${candidate.id}`)
      .then((res) => {
        console.log("Response from candidateViews API:", res);
        if (!res.ok) {
          console.error("Failed to fetch candidate profile views");
          throw new Error("Failed to fetch candidate profile views");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Data received for profile views:", data);
        // Assuming the API returns an object with a 'viewCount' field
        setProfileViews(data.viewCount);
      })
      .catch((err) =>
        console.error("Error fetching candidate profile views:", err)
      );
  }, [candidate]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileViews}</div>
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
            <Link href="/candidates/candidate-dashboard/profile-settings">
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
