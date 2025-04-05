"use client";

import React from "react";
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
import { CardDescription } from "@/components/ui/card"; // Optional

// Placeholder data - replace with actual fetched data
const placeholderData = [
  { name: "Jan", views: 400, visitors: 240 },
  { name: "Feb", views: 300, visitors: 139 },
  { name: "Mar", views: 200, visitors: 980 },
  { name: "Apr", views: 278, visitors: 390 },
  { name: "May", views: 189, visitors: 480 },
  { name: "Jun", views: 239, visitors: 380 },
  { name: "Jul", views: 349, visitors: 430 },
];

export function EngagementChart() {
  return (
    <>
      <CardDescription className="mb-4 text-sm text-gray-500">
        Monthly profile views vs. unique visitors.
      </CardDescription>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={placeholderData}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5, // Adjusted left margin
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
            }}
            labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
            itemStyle={{ color: "#4b5563" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Bar
            dataKey="views"
            fill="#8884d8"
            name="Profile Views"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="visitors"
            fill="#82ca9d"
            name="Unique Visitors"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
