"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  views: number;
}

interface AnalyticsChartProps {
  candidateId?: number;
  days?: number; // default 30
  onDataLoaded?: (summary: { total: number; days: number }) => void;
}

const generateData = () => {
  const data = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().slice(0, 10),
      timestamp: date.getTime(),
      views: Math.floor(Math.random() * 20) + 5,
      interactions: Math.floor(Math.random() * 10) + 1,
    });
  }

  return data;
};

const sampleData = generateData();

export default function AnalyticsChart({
  candidateId,
  days = 30,
  onDataLoaded,
}: AnalyticsChartProps) {
  const [data, setData] = useState<DataPoint[] | []>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!candidateId) {
      // fallback demo data
      setData(sampleData.map((d) => ({ date: d.date, views: d.views })));
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `/api/candidateViews/timeseries?candidateID=${candidateId}&days=${days}`
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed fetching timeseries");
        return r.json();
      })
      .then((json) => {
        setData(json.data);
        if (onDataLoaded) {
          onDataLoaded({
            total:
              json.totalViews ??
              json.data.reduce((a: number, d: any) => a + (d.views || 0), 0),
            days,
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [candidateId, days, onDataLoaded]);
  // Build display data (aggregate into 3-day buckets on mobile)
  const displayData = (() => {
    if (!isMobile) return data;
    const BUCKET = 3;
    const buckets: any[] = [];
    for (let i = 0; i < data.length; i += BUCKET) {
      const slice = data.slice(i, i + BUCKET);
      if (slice.length === 0) continue;
      const start = slice[0].date;
      const end = slice[slice.length - 1].date;
      const viewsSum = slice.reduce((a, d) => a + (d.views || 0), 0);
      buckets.push({
        date: start, // use start as key
        startDate: start,
        endDate: end,
        rangeLabel: start === end ? start : `${start}__${end}`,
        views: viewsSum,
        days: slice.length,
      });
    }
    return buckets;
  })();
  return (
    <div className="h-[300px] w-full">
      {loading && <div className="text-xs text-gray-500">Loading chart...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              interval={0}
              tickFormatter={(tick) => {
                const d = new Date(tick);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              minTickGap={isMobile ? 4 : 5}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [
                value,
                isMobile ? "Views (3-day)" : "Profile Views",
              ]}
              labelFormatter={(label, payload) => {
                if (!isMobile) {
                  const d = new Date(label);
                  return d.toLocaleDateString();
                }
                const bucket =
                  payload && payload[0] && (payload[0].payload as any);
                if (bucket?.startDate) {
                  const s = new Date(bucket.startDate);
                  const e = new Date(bucket.endDate);
                  const fmt = (dt: Date) =>
                    `${dt.getMonth() + 1}/${dt.getDate()}`;
                  return bucket.startDate === bucket.endDate
                    ? fmt(s)
                    : `${fmt(s)} – ${fmt(e)}`;
                }
                const d = new Date(label);
                return d.toLocaleDateString();
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#8884d8"
              fill="#8884d8"
              name="Profile Views"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
