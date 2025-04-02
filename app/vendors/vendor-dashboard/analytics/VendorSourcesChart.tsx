"use client";

import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";

const sampleData = [
  { name: "Direct Search", value: 42 },
  { name: "Candidate Referrals", value: 28 },
  { name: "Category Browse", value: 18 },
  { name: "External Links", value: 12 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#eab308"];

interface TrafficSource {
  name: string;
  value: number;
}

export default function VendorSourcesChart() {
  const [data, setData] = useState<TrafficSource[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourcesData = async () => {
      try {
        // const response = await fetch("/api/vendor/analytics/sources");
        // if (!response.ok) {
        //   throw new Error("Failed to fetch traffic sources data");
        // }
        // const sourcesData = await response.json();
        const sourcesData = sampleData;
        setData(sourcesData);
      } catch (err) {
        setError("Error loading traffic sources data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSourcesData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}`, "Count"]} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
