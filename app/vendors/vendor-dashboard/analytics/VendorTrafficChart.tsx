"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample data - this would be replaced with real analytics data
const generateData = () => {
  const data = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 40) + 10 + (i % 7 === 0 ? 15 : 0),
    });
  }

  return data;
};

const data = generateData();

export default function VendorTrafficChart() {
  return (
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
          formatter={(value: number) => [`${value} views`, "Profile Views"]}
          labelFormatter={(label) => {
            const d = new Date(label);
            return d.toLocaleDateString();
          }}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="#8884d8"
          fill="url(#colorViews)"
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}
