"use client";

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

const data = generateData();

export default function VendorEngagementChart() {
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
