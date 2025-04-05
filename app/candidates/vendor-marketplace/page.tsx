// app/(candidate_features)/vendors/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { VendorCategoryFilter } from "./VendorCategoryFilter";
import { useRouter } from "next/navigation";
import { VendorLocationSelector } from "./VendorLocationSelector";
import { VendorList } from "./VendorList";
import { Button } from "@/components/ui/button";
import { FaArrowLeft } from "react-icons/fa";
import {
  ServiceCategoryFilterItem,
  DiscoveryVendor,
  VendorDiscoveryResponse,
} from "@/types/vendor";
import { NormalizedLocation } from "@/types/geocoding";
import { useAuth } from "@clerk/nextjs"; // To potentially get candidate's default location

// Debounce function (assuming it's correctly imported or defined)
// import { debounce } from "@/lib/debounce";
import { Candidate } from "@prisma/client";

// Main component for the Vendor Discovery page
export default function VendorDiscoveryPage() {
  // State variables for filters, vendors, loading, pagination, and errors
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [vendors, setVendors] = useState<DiscoveryVendor[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryFilterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const router = useRouter();

  const { userId } = useAuth();
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/candidate?clerkUserId=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch candidate: ${res.statusText}`);
        }
        return res.json();
      })
      .then((candidate: Candidate) => {
        if (candidate && candidate.city && candidate.state) {
          //   setLocation({
          //     city: candidate.city,
          //     state: candidate.state,
          //     stateName: candidate.state,
          //   });
        }
      })
      .catch((err) => console.error("Error fetching candidate:", err));
  }, [userId]);

  // Function to fetch vendors from the API
  const fetchVendors = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      // Construct query parameters based on current state
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append("categoryId", selectedCategoryId);
      }
      if (location?.city) {
        params.append("city", location.city);
      }
      if (location?.state) {
        params.append("state", location.state);
      }
      params.append("page", page.toString());
      params.append("limit", "12"); // Or make this configurable

      try {
        // Fetch data from the discovery API endpoint
        const response = await fetch(
          `/api/vendors/discovery?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.statusText}`);
        }
        const data: VendorDiscoveryResponse = await response.json();
        // Update state with fetched data
        setVendors(data.vendors);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err: unknown) {
        // Handle errors during fetch
        console.error(err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setVendors([]); // Clear vendors on error
      } finally {
        // Set loading state to false regardless of success or failure
        setIsLoading(false);
      }
    },
    [selectedCategoryId, location]
  ); // Dependencies for useCallback

  // Debounced version of fetchVendors for location changes
  // const debouncedFetchVendors = useCallback(debounce(fetchVendors, 500), [
  //   fetchVendors,
  // ]);

  // Fetch categories on initial component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/vendors/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data: ServiceCategoryFilterItem[] = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        // Handle category fetch error (e.g., show a message)
      }
    };
    fetchCategories();
  }, []); // Empty dependency array ensures this runs only once

  // Fetch vendors when filters or page change
  useEffect(() => {
    fetchVendors(currentPage);
  }, [selectedCategoryId, location, currentPage, fetchVendors]); // Include fetchVendors in dependency array

  // Handlers for filter changes
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page on filter change
    // fetchVendors(1); // Fetch immediately
  };

  const handleLocationChange = (newLocation: NormalizedLocation | null) => {
    setLocation(newLocation);
    setCurrentPage(1); // Reset to first page on filter change
    // debouncedFetchVendors(1); // Fetch after debounce
  };

  // Handlers for pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Vendor Marketplace
      </h1>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4">
        {/* Location Selector */}
        <div className="md:col-span-2">
          <VendorLocationSelector
            onLocationChange={handleLocationChange}
            // Pass defaultLocation if fetched: defaultLocation={candidateLocation}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter City, State, or ZIP Code. Results matching State/City are
            prioritized.
          </p>
        </div>

        {/* Category Filter */}
        <div>
          <VendorCategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Vendor List Section */}
      {isLoading ? (
        // Loading state display
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skeleton loaders */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 shadow animate-pulse"
            >
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error message display
        <p className="text-red-600 text-center">{error}</p>
      ) : vendors.length === 0 ? (
        // No results message
        <p className="text-gray-600 text-center py-10">
          No vendors found matching your criteria.
        </p>
      ) : (
        // Display vendor list and pagination
        <>
          <VendorList vendors={vendors} />
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
