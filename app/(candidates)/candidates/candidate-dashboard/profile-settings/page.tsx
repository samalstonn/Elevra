"use client";

import React, { useState, useEffect } from "react";
import { ProfileForm } from "./ProfileForm";
// import { PhotoUpload } from "./PhotoUpload";
import { CandidateDashboardData } from "@/types/candidate";
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ProfileSettingsPage() {
  const { userId, isLoaded } = useAuth();
  const [candidateData, setCandidateData] =
    useState<CandidateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch candidate data only when Clerk is loaded and userId is available
    if (isLoaded && userId) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/candidate?clerkUserId=${userId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Failed to fetch candidate data: ${res.statusText}`
            );
          }
          return res.json();
        })
        .then((data: CandidateDashboardData) => {
          setCandidateData(data);
        })
        .catch((err) => {
          console.error("Error fetching candidate data:", err);
          setError(err.message || "Could not load profile data.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isLoaded && !userId) {
      // Handle case where user is loaded but not logged in (shouldn't happen with middleware)
      setError("User not authenticated.");
      setIsLoading(false);
    }
    // If Clerk is not loaded yet, isLoading remains true
  }, [userId, isLoaded]);

  // Handle profile update success
  const handleUpdateSuccess = (updatedData: CandidateDashboardData) => {
    setCandidateData(updatedData); // Update local state with the response from the API
  };

  // Loading State
  if (isLoading) {
    return (
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
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Candidate data not found (after loading and no error)
  if (!candidateData) {
    return (
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Profile Not Found</AlertTitle>
        <AlertDescription>
          Could not find a candidate profile associated with your account.
          Please ensure you have completed the initial setup or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="md:col-span-2">
          <ProfileForm
            candidateData={candidateData}
            onUpdateSuccess={handleUpdateSuccess}
          />
        </div>
        {/* Photo Upload */}
        {/* <div>
          <PhotoUpload
            currentPhotoUrl={candidateData.photoUrl}
            candidateId={candidateData.id}
            // TODO: Add isPremium flag based on subscription
            isPremium={false} // Placeholder
          />
        </div> */}
      </div>
    </div>
  );
}
