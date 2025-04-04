// app/(candidate_features)/candidate-dashboard/loading.tsx
// This file provides the loading UI for the dashboard routes
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from 'lucide-react';

// Basic loading component - displayed while page content loads
export default function DashboardLoading() {
  return (
    // You can customize this loading UI extensively.
    // Option 1: Simple Centered Spinner
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]"> {/* Adjust height based on header/padding */}
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
    </div>

    // Option 2: Skeleton matching page structure (like profile settings loading)
    /*
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>  
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
       <Skeleton className="h-40 w-full" />
    </div>
    */
  );
}
