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
  return (
    <div className="h-[300px] w-full">
      {loading && <div className="text-xs text-gray-500">Loading chart...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
              tickFormatter={(tick) => {
                const d = new Date(tick);
                return d.getMonth() + 1 + "/" + d.getDate();
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [value, "Profile Views"]}
              labelFormatter={(label) => {
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
