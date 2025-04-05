// app/(candidate_features)/candidate-dashboard/loading.tsx
// This file provides the loading UI for the dashboard routes
import React from "react";
import { Loader2 } from "lucide-react";

// Basic loading component - displayed while page content loads
export default function DashboardLoading() {
  return (
    // You can customize this loading UI extensively.
    // Option 1: Simple Centered Spinner
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      {" "}
      {/* Adjust height based on header/padding */}
      <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
    </div>
  );
}
