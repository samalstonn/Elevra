"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data - this would be replaced with real analytics data
const generateData = () => {
  const data = [];
  const now = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 30) + 5 + Math.sin(i / 10) * 10,
      visitors: Math.floor(Math.random() * 15) + 3 + Math.sin(i / 10) * 5,
      engagement: Math.floor(Math.random() * 8) + 1 + Math.sin(i / 10) * 3,
    });
  }

  return data;
};

const data = generateData();

export default function VendorAnalyticsOverview() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => [
            value,
            name === "views"
              ? "Profile Views"
              : name === "visitors"
              ? "Unique Visitors"
              : "Engagement Actions",
          ]}
          labelFormatter={(label) => {
            const d = new Date(label);
            return d.toLocaleDateString();
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#8884d8"
          name="Profile Views"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          stroke="#82ca9d"
          name="Unique Visitors"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="engagement"
          stroke="#ffc658"
          name="Engagement Actions"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
