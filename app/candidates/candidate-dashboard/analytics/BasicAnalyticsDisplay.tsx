"use client";

import React from "react";
import { StatsCard } from "./StatsCard";
import { EngagementChart } from "./EngagementChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Mail } from "lucide-react"; // Example icons

// Placeholder data for basic analytics
const basicStats = [
  {
    label: "Profile Views (Last 30d)",
    value: "1,234",
    change: 10.5,
    icon: Eye,
  },
  {
    label: "Unique Visitors (Last 30d)",
    value: "876",
    change: 5.2,
    icon: Users,
  },
  {
    label: "Mailing List Signups (Last 30d)",
    value: "23",
    change: -2.1,
    icon: Mail,
  },
];

export function BasicAnalyticsDisplay() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {basicStats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <EngagementChart />
        </CardContent>
      </Card>
    </div>
  );
}
