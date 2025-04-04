"use client";

import React, { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import { EngagementChart } from "./EngagementChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Mail, LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Define types for our analytics data
interface AnalyticsStat {
  label: string;
  value: string;
  change: number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

export function BasicAnalyticsDisplay() {
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await fetch('/api/candidates/analytics');
        // const data = await response.json();

        setStats(basicStats);
        setError(null);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse h-20"></div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <StatsCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
            />
          ))}
        </div>
      )}

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-[300px] bg-gray-100 rounded-md"></div>
          ) : error ? (
            <p className="text-center text-red-500 py-12">
              Failed to load chart data
            </p>
          ) : (
            <EngagementChart />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
