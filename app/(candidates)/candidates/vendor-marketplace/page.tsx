"use client";

// TODO: Add Vercel's geo headers

import React, { useState, useEffect, useCallback } from "react";
import {
  ServiceCategoryFilterItem,
  DiscoveryVendor,
  VendorDiscoveryResponse,
} from "@/types/vendor";
import { NormalizedLocation } from "@/types/geocoding";
import { useAuth } from "@clerk/nextjs";
import VendorLocationSelector from "./VendorLocationSelector";
import { VendorCategoryFilter } from "./VendorCategoryFilters";
import { VendorGrid } from "./VendorGrid";

const VendorDiscoveryPage = () => {
  // State for single category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [vendors, setVendors] = useState<DiscoveryVendor[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryFilterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const { userId } = useAuth();

  // Fetch candidate's location on component mount
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/candidate?clerkUserId=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch candidate: ${res.statusText}`);
        }
        return res.json();
      })
      .then((candidate) => {
        if (candidate?.city && candidate?.state) {
          // setLocation({
          //   city: candidate.city,
          //   state: candidate.state,
          //   stateName: candidate.state,
          // });
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

      // Add category ID if selected
      if (selectedCategoryId !== null) {
        params.append("categoryId", selectedCategoryId.toString());
      }

      if (location?.city) {
        params.append("city", location.city);
      }
      if (location?.state) {
        params.append("state", location.state);
      }
      params.append("page", page.toString());
      params.append("limit", "12"); // 12 items per page (3 rows of 4)
      params.append("orderBy", "proximity"); // Order by proximity to location

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
        setVendors(data.vendors || []);
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
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
  );

  // Fetch categories on initial component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/vendors/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data: ServiceCategoryFilterItem[] = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch vendors when filters or page change
  useEffect(() => {
    fetchVendors(currentPage);
  }, [selectedCategoryId, location, currentPage, fetchVendors]);

  // Handler for category filter changes
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handler for location search change
  const handleLocationChange = (newLocation: NormalizedLocation | null) => {
    setLocation(newLocation);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="container mx-auto px-4 py-5">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-[#141118] tracking-[-0.015em] mb-6">
        Vendor Marketplace
      </h1>

      {/* Search Location Bar */}
      <div className="mb-4">
        <VendorLocationSelector onLocationChange={handleLocationChange} />
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <VendorCategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Vendor Grid */}
      <VendorGrid vendors={vendors} isLoading={isLoading} error={error} />

      {/* Pagination - if needed */}
      {!isLoading && !error && totalPages > 1 && (
        <nav
          aria-label="Vendor pagination"
          className="flex justify-center items-center space-x-4 mt-8"
        >
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span
            className="text-gray-700"
            aria-current="page"
            aria-label={`Page ${currentPage} of ${totalPages}`}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
};

// Make sure to export the component as default
export default VendorDiscoveryPage;
