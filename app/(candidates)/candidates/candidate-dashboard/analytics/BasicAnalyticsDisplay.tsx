"use client";

import React, { useEffect, useState } from "react";
import { StatsCard } from "../../../../../components/StatsCard";
import { EngagementChart } from "./EngagementChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, MapPin, LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCandidate } from "@/lib/useCandidate";
import ViewsHeatmap from "@/components/ViewsHeatmap";

// Helper types

// Define types for our analytics data
interface AnalyticsStat {
  label: string;
  value: number;
  change?: number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

interface LocationSummary {
  totalViews: number;
  uniqueLocations: number;
  locations: {
    location: string;
    views: number;
    city?: string | null;
    region?: string | null;
    country?: string | null;
    source: "ipinfo" | "private" | "unknown";
  }[];
}

export function BasicAnalyticsDisplay() {
  const [stats, setStats] = useState<AnalyticsStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationSummary, setLocationSummary] =
    useState<LocationSummary | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { data: candidate } = useCandidate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        if (!candidate) {
          setStats([]);
          setError(null);
          return;
        }
        // Fetch total views and total unique visitors for the last 30 days
        const [viewsResp, uniquesResp, competitorsResp] = await Promise.all([
          fetch(
            `/api/candidateViews/timeseries?candidateID=${candidate.id}&days=30`
          ),
          fetch(
            `/api/candidateViews/unique-timeseries?candidateID=${candidate.id}&days=30`
          ),
          fetch(
            `/api/candidateViews/competition?candidateID=${candidate.id}&days=30`
          ),
        ]);
        if (!viewsResp.ok) throw new Error("Failed to load views");
        if (!uniquesResp.ok) throw new Error("Failed to load unique visitors");
        if (!competitorsResp.ok)
          throw new Error("Failed to load competitor views");
        const uniquesJson = (await uniquesResp.json()) as {
          totalUniqueVisitors?: number;
        };
        const competitorsJson = (await competitorsResp.json()) as {
          totalViews?: number;
        };

        const computed: AnalyticsStat[] = [
          {
            label: "Unique Visitors (Last 30d)",
            value: uniquesJson.totalUniqueVisitors ?? 0,
            icon: Users,
          },
          {
            label: "Views from Candidates in Your Election (Last 30d)",
            value: competitorsJson.totalViews ?? 0,
            icon: Target,
          },
        ];
        setStats(computed);
        setError(null);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [candidate]);

  useEffect(() => {
    if (!candidate) {
      setLocationSummary(null);
      setLocationLoading(false);
      return;
    }

    let cancelled = false;
    const fetchLocations = async () => {
      try {
        setLocationLoading(true);
        const response = await fetch(
          `/api/candidateViews/location-summary?candidateID=${candidate.id}&days=30`
        );
        if (!response.ok) {
          throw new Error("Failed to load location data");
        }
        const json = (await response.json()) as LocationSummary;
        if (cancelled) return;
        setLocationSummary(json);
        setLocationError(null);
      } catch (err) {
        console.error("Error fetching location summary:", err);
        if (cancelled) return;
        setLocationSummary(null);
        setLocationError(
          "Location insights are unavailable. Add an IP info token to enable them."
        );
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    };

    fetchLocations();

    return () => {
      cancelled = true;
    };
  }, [candidate]);

  useEffect(() => {
    setStats((prev) =>
      prev.filter((stat) => stat.label !== "Unique Viewer Locations (Last 30d)")
    );

    if (locationSummary) {
      setStats((prev) => [
        ...prev,
        {
          label: "Unique Viewer Locations (Last 30d)",
          value: locationSummary.uniqueLocations,
          icon: MapPin,
        },
      ]);
    }
  }, [locationSummary]);

  const topLocations = locationSummary?.locations.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
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
      {/* Top Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Voter Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-6 w-full rounded bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : locationError ? (
            <p className="text-sm text-red-500 text-center py-4">
              {locationError}
            </p>
          ) : topLocations.length > 0 ? (
            <div className="space-y-3">
              {topLocations.map((location) => (
                <div
                  key={`${location.location}-${location.source}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{location.location}</span>
                  <span className="font-medium text-gray-900">
                    {location.views}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Location data is not available yet. Try again after more views are
              recorded.
            </p>
          )}
        </CardContent>
      </Card>

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
            candidate && <EngagementChart candidateId={candidate.id} days={7} />
          )}
        </CardContent>
      </Card>

      {/* Time-of-Day Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Time-of-Day Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate ? (
            <ViewsHeatmap candidateId={candidate.id} days={30} />
          ) : loading ? (
            <div className="text-xs text-gray-500">Loading candidate...</div>
          ) : (
            <div className="text-xs text-gray-500">No candidate found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
