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
  interactions: number;
}

const generateData = () => {
  const data = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 20) + 5,
      interactions: Math.floor(Math.random() * 10) + 1,
    });
  }

  return data;
};

const sampleData = generateData();

export default function VendorAnalyticsChart() {
  const [data, setData] = useState<DataPoint[] | []>([]);

  useEffect(() => {
    // Option 1: Fetch from real API
    // fetchVendorTrafficData().then(setData);

    // Option 2: Generate fresh random data for demo purposes
    setData(sampleData);
  }, []);
  return (
    <div className="h-[300px] w-full">
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
            tickFormatter={(date) => {
              const d = new Date(date);
              return d.getDate() + "/" + (d.getMonth() + 1);
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value,
              name === "views" ? "Profile Views" : "Interactions",
            ]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString();
            }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stackId="1"
            stroke="#8884d8"
            fill="#8884d8"
            name="Profile Views"
          />
          <Area
            type="monotone"
            dataKey="interactions"
            stackId="1"
            stroke="#82ca9d"
            fill="#82ca9d"
            name="Interactions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
