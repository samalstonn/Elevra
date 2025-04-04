"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Edit, BarChart3, Mail, HandCoins } from "lucide-react"; // Icons

export default function OverviewPage() {
  // Placeholder data - replace with actual fetched data later
  const placeholderStats = {
    profileViews: 123,
    subscribers: 45,
    donations: 0, // Placeholder for premium feature
  };

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
            <div className="text-2xl font-bold">
              {placeholderStats.profileViews}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>{" "}
            {/* Placeholder change */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mailing List Subscribers
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {placeholderStats.subscribers}
            </div>
            <p className="text-xs text-muted-foreground">+5 since last week</p>{" "}
            {/* Placeholder change */}
          </CardContent>
        </Card>
        <Card className="opacity-50 bg-gray-50">
          {" "}
          {/* Placeholder for locked feature */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donations
            </CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Use correct icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <Link
              href="/candidate-dashboard/upgrade"
              className="text-xs text-blue-600 hover:underline"
            >
              Upgrade to track donations
            </Link>
          </CardContent>
        </Card>
      </div>

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
          <Button variant="outline" asChild>
            <Link href="//candidate/your-public-profile-slug">
              {" "}
              {/* TODO: Link to actual public profile */}
              <Eye className="mr-2 h-4 w-4" /> View Public Profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/candidates/candidate-dashboard/analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/candidates/candidate-dashboard/mailing-lists">
              <Mail className="mr-2 h-4 w-4" /> Manage Mailing Lists
            </Link>
          </Button>
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
