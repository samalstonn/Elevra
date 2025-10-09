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
interface BucketPoint extends DataPoint {
  startDate: string;
  endDate: string;
  rangeLabel: string;
  days: number;
}
type DisplayPoint = DataPoint | BucketPoint;

interface TimeseriesPoint {
  date: string;
  views: number;
}

interface TimeseriesApiResponse {
  data: TimeseriesPoint[];
  totalViews?: number;
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
        return r.json() as Promise<TimeseriesApiResponse>;
      })
      .then((json) => {
        setData(json.data);
        if (onDataLoaded) {
          const serverData: { date: string; views: number }[] = json.data;
          onDataLoaded({
            total:
              json.totalViews ??
              serverData.reduce((a: number, d) => a + (d.views || 0), 0),
            days,
          });
        }
      })
      .catch((e: unknown) => {
        const message =
          typeof e === "object" && e && "message" in e
            ? (e as { message?: string }).message || "Unknown error"
            : "Unknown error";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [candidateId, days, onDataLoaded]);
  // Build display data (aggregate into 3-day buckets on mobile)
  const displayData: DisplayPoint[] = (() => {
    if (!isMobile) return data;
    const BUCKET = 3;
    const buckets: BucketPoint[] = [];
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
      {loading && (
        <div className="text-xs text-muted-foreground">Loading chart...</div>
      )}
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
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.2)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              interval={0}
              tickFormatter={(tick) => {
                // If tick is a plain YYYY-MM-DD string, avoid new Date() (which treats it as UTC and can shift the day locally)
                if (typeof tick === "string") {
                  const isoDayPattern = /^\d{4}-\d{2}-\d{2}$/;
                  if (isoDayPattern.test(tick)) {
                    const [, month, day] = tick.split("-"); // ignore year
                    return `${Number(month)}/${Number(day)}`; // strip leading zeros
                  }
                }
                // Fallback: attempt to construct a Date (handles numeric timestamps or other date-like strings)
                const d = new Date(
                  typeof tick === "number" ? tick : String(tick)
                );
                if (!isNaN(d.getTime())) {
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }
                // Last resort: return raw tick
                return String(tick);
              }}
              tick={{
                fontSize: isMobile ? 10 : 12,
                fill: "hsl(var(--muted-foreground))",
              }}
              minTickGap={isMobile ? 4 : 5}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              formatter={(value: number) => [
                value,
                isMobile ? "Views (3-day)" : "Profile Views",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{
                color: "hsl(var(--muted-foreground))",
                fontWeight: 500,
              }}
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
              labelFormatter={(label, payload) => {
                const isoDayPattern = /^\d{4}-\d{2}-\d{2}$/;
                const fmtIso = (str: string) => {
                  if (isoDayPattern.test(str)) {
                    const [, m, d] = str.split("-");
                    return `${Number(m)}/${Number(d)}`;
                  }
                  const dt = new Date(str);
                  if (!isNaN(dt.getTime())) {
                    return `${dt.getMonth() + 1}/${dt.getDate()}`;
                  }
                  return str;
                };
                if (!isMobile) {
                  return fmtIso(String(label));
                }
                const bucket = payload?.[0]?.payload as BucketPoint | undefined;
                if (bucket?.startDate) {
                  const start = fmtIso(bucket.startDate);
                  const end = fmtIso(bucket.endDate);
                  return bucket.startDate === bucket.endDate
                    ? start
                    : `${start} – ${end}`;
                }
                return fmtIso(String(label));
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              name="Profile Views"
              fillOpacity={0.25}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
