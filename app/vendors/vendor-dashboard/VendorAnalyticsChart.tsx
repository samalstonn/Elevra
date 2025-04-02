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

interface DataPoint {
  date: string;
  views: number;
  interactions: number;
}

interface VendorAnalyticsChartProps {
  data: DataPoint[];
}

export default function VendorAnalyticsChart({ data }: VendorAnalyticsChartProps) {
  // component implementation, e.g., rendering the chart with the passed data
  return (
    <div>
      {/* Your chart component implementation here using the 'data' prop */}
    </div>
  );
}

export default function VendorAnalyticsChart() {
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
