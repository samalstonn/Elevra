"use client";

import React from "react";
import { BasicAnalyticsDisplay } from "./BasicAnalyticsDisplay";
// Import AdvancedAnalyticsDisplay later when implemented
// import { AdvancedAnalyticsDisplay } from './AdvancedAnalyticsDisplay';
import { useAuth } from "@clerk/nextjs"; // To check subscription later
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  // TODO: Replace with actual subscription check from Clerk user metadata
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
          {/* Upgrade Prompt */}
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <CreditCard className="h-4 w-4 !text-blue-800" />{" "}
            {/* Ensure icon color matches */}
            <AlertTitle>Unlock Advanced Analytics</AlertTitle>
            <AlertDescription>
              Gain deeper insights into profile engagement, reach, and more.
              <Link
                href="/candidate-dashboard/upgrade"
                className="font-semibold underline ml-2 hover:text-blue-900"
              >
                Upgrade Now
              </Link>
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
