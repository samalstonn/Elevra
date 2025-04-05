// app/(candidate_features)/vendors/VendorList.tsx
import React from "react";
import { VendorCard } from "./VendorCard";
import { DiscoveryVendor } from "@/types/vendor";

interface VendorListProps {
  vendors: DiscoveryVendor[];
}

export function VendorList({ vendors }: VendorListProps) {
  // Render a grid of VendorCard components
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
