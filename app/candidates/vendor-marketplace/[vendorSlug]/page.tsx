// app/(main)/vendors/[vendorSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VendorHeader } from "./components/VendorHeader";
import { VendorAbout } from "./components/VendorAbout";
import { VendorPortfolio } from "./components/VendorPortfolio";
import { VendorTestimonials } from "./components/VendorTestimonials";
import { VendorContactForm } from "./components/VendorContactForm"; // Import the new form
import { Dialog } from "@/components/ui/dialog"; // Import Dialog for the contact form modal
import { PublicVendorProfileData } from "@/types/vendor";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Main component for the vendor profile page
export default function VendorProfilePage() {
  const params = useParams();
  const vendorSlug = params?.vendorSlug as string;

  const [profileData, setProfileData] =
    useState<PublicVendorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false); // State for dialog visibility

  useEffect(() => {
    if (!vendorSlug) {
      setError("Vendor slug not found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/vendors/profile/${vendorSlug}`);

        if (response.status === 404) {
          throw new Error("Vendor not found.");
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to get error details
          throw new Error(
            `Failed to fetch profile: ${response.statusText} ${
              errorData.error || ""
            }`
          );
        }

        const data: PublicVendorProfileData = await response.json();
        setProfileData(data);
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [vendorSlug]);

  // Loading State UI
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
        {/* Skeleton for Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2 justify-center sm:justify-start pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        {/* Skeleton for About */}
        <Skeleton className="h-32 w-full border border-gray-200 rounded-lg p-6" />
        {/* Skeleton for Portfolio/Testimonials */}
        <Skeleton className="h-64 w-full border border-gray-200 rounded-lg p-6" />
      </div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8 text-center text-gray-500">
        Vendor profile data could not be loaded.
      </div>
    );
  }

  // Render the profile page with Dialog wrapper
  return (
    // Wrap the relevant part (or whole page) in the Dialog component
    <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header Section (Contains DialogTrigger) */}
          <VendorHeader vendor={profileData} />

          {/* About Section */}
          <VendorAbout bio={profileData.bio} />

          {/* Portfolio Section */}
          {profileData.portfolio && profileData.portfolio.length > 0 && (
            <VendorPortfolio items={profileData.portfolio} />
          )}

          {/* Testimonials Section */}
          {profileData.testimonials && profileData.testimonials.length > 0 && (
            <VendorTestimonials testimonials={profileData.testimonials} />
          )}

          {/* Message if no portfolio or testimonials */}
          {(!profileData.portfolio || profileData.portfolio.length === 0) &&
            (!profileData.testimonials ||
              profileData.testimonials.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                No portfolio items or testimonials available yet.
              </p>
            )}
        </div>
      </div>

      {/* Contact Form Dialog Content */}
      {/* This content is rendered conditionally by the Dialog component based on `isContactFormOpen` */}
      <VendorContactForm
        vendorName={profileData.name}
        vendorId={profileData.id}
        onClose={() => setIsContactFormOpen(false)} // Pass function to close dialog
      />
    </Dialog>
  );
}
