"use client";

import { useEffect, useState } from "react";
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

type DataPoint = {
  name: string;
  count: number;
  rate: number;
};

// Sample data - this would be replaced with real analytics data
const generateData = () => {
  const data = [];

  for (let i = 0; i < 7; i++) {
    data.push({
      name: [
        "Profile View",
        "Portfolio View",
        "Testimonial View",
        "Bio Read",
        "Contact Info",
        "Website Click",
        "Email Click",
      ][i],
      count: Math.floor(Math.random() * 150) + 50 - i * 15,
      rate: Math.floor((Math.random() * 30 + 10 - i * 3) * 10) / 10,
    });
  }

  return data;
};

const sampleData = generateData();

export default function VendorEngagementChart() {
  const [data, setData] = useState<DataPoint[] | []>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

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
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          yAxisId="left"
          dataKey="count"
          name="Total Count"
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="rate"
          name="Engagement Rate (%)"
          fill="#82ca9d"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
