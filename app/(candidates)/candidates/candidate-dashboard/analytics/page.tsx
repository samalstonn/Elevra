"use client";

import React from "react";
import { BasicAnalyticsDisplay } from "./BasicAnalyticsDisplay";
import { usePageTitle } from "@/lib/usePageTitle";

export default function AnalyticsPage() {
  usePageTitle("Candidate Dashboard – Analytics");
  const isPremiumUser = false; // Placeholder

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Campaign Analytics</h1>

      {/* Conditionally render basic or advanced analytics based on subscription */}
      {isPremiumUser ? (
        // <AdvancedAnalyticsDisplay /> // Placeholder for premium view
        <BasicAnalyticsDisplay /> // Show basic for now even if premium
      ) : (
        <>
          <BasicAnalyticsDisplay />
        </>
      )}
    </div>
  );
}
