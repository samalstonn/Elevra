"use client";
import React, { useState, useEffect } from "react";
import { PhotoUploader } from "@/components/ProfilePhotoUploader";
import { useAuth } from "@clerk/nextjs";
import { CandidateDashboardData } from "@/types/candidate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Terminal } from "lucide-react";
import BasicProfileForm from "./BasicProfileForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BioSettingsPage() {
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
    <div className="w-full h-full ">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col space-y-4">
          <PhotoUploader
            clerkUserId={userId!}
            currentPhotoUrl={candidateData?.photoUrl || null}
            onUpload={(url) => {
              if (candidateData) {
                handleUpdateSuccess({
                  ...candidateData,
                  photoUrl: url,
                });
              }
            }}
          />
          <Button variant="purple" asChild className="w-full">
            <Link
              href={
                candidateData
                  ? `/candidate/${candidateData.slug}`
                  : "/candidates"
              }
            >
              <Eye className="mr-2 h-4 w-4" /> View Public Profile
            </Link>
          </Button>
        </div>

        <div className="flex-1 mt-4 md:mt-0">
          <BasicProfileForm />
        </div>
      </div>
    </div>
  );
}
