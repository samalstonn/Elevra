"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CardDescription } from "@/components/ui/card"; // Optional

interface TimeseriesResp {
  data: { date: string; views: number }[];
}
interface UniqueResp {
  data: { date: string; uniqueVisitors: number }[];
}

interface EngagementChartProps {
  candidateId: number;
  days?: number;
}

export function EngagementChart({
  candidateId,
  days = 7,
}: EngagementChartProps) {
  const [views, setViews] = useState<TimeseriesResp["data"]>([]);
  const [uniques, setUniques] = useState<UniqueResp["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(
        `/api/candidateViews/timeseries?candidateID=${candidateId}&days=${days}`
      ).then((r) => {
        if (!r.ok) throw new Error("Failed to load views timeseries");
        return r.json() as Promise<TimeseriesResp>;
      }),
      fetch(
        `/api/candidateViews/unique-timeseries?candidateID=${candidateId}&days=${days}`
      ).then((r) => {
        if (!r.ok) throw new Error("Failed to load unique visitors timeseries");
        return r.json() as Promise<UniqueResp>;
      }),
    ])
      .then(([v, u]) => {
        if (cancelled) return;
        setViews(v.data);
        setUniques(u.data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, days]);

  const merged = useMemo(() => {
    const map = new Map<
      string,
      { name: string; views: number; visitors: number }
    >();
    for (const d of views) {
      map.set(d.date, { name: d.date, views: d.views, visitors: 0 });
    }
    for (const d of uniques) {
      const entry = map.get(d.date) || { name: d.date, views: 0, visitors: 0 };
      entry.visitors = d.uniqueVisitors;
      map.set(d.date, entry);
    }
    return Array.from(map.values());
  }, [views, uniques]);

  return (
    <>
      <CardDescription className="mb-4 text-sm text-gray-500">
        Daily profile views vs. unique visitors (last {days} days).
      </CardDescription>
      {loading && <div className="text-xs text-gray-500">Loading…</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={merged}
            margin={{
              top: 5,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
              }}
              labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
              itemStyle={{ color: "#4b5563" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar
              dataKey="views"
              fill="#8884d8"
              name="Profile Views"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="visitors"
              fill="#82ca9d"
              name="Unique Visitors"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );
}
