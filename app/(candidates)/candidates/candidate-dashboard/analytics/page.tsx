"use client";

import React from "react";
import { BasicAnalyticsDisplay } from "./BasicAnalyticsDisplay";
import { usePageTitle } from "@/lib/usePageTitle";

export default function AnalyticsPage() {
  usePageTitle("Candidate Dashboard – Analytics");
  // TODO: Replace with actual subscription check from Clerk user metadata

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Campaign Analytics</h1>
      <BasicAnalyticsDisplay />
    </div>
  );
}
