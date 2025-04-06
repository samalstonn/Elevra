// VendorGrid.tsx
import React from "react";
import { DiscoveryVendor } from "@/types/vendor";
import { VendorCard } from "./VendorCard";

interface VendorGridProps {
  vendors: DiscoveryVendor[];
  isLoading: boolean;
  error: string | null;
}

export function VendorGrid({ vendors, isLoading, error }: VendorGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 pb-3">
            <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center py-10">{error}</p>;
  }

  if (vendors.length === 0) {
    return (
      <p className="text-gray-600 text-center py-10">
        No vendors found matching your criteria.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
