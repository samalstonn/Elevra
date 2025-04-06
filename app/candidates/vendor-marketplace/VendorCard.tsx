// VendorCard.tsx
import React from "react";
import Link from "next/link";
import { DiscoveryVendor } from "@/types/vendor";

interface VendorCardProps {
  vendor: DiscoveryVendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link
      href={`/candidates/vendor-marketplace/${vendor.slug}`}
      className="block"
    >
      <div className="flex flex-col gap-3 pb-3 group">
        <div
          className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
          style={{
            backgroundImage: `url(${
              vendor.photoUrl || "/placeholder-logo.png"
            })`,
          }}
        />
        <div>
          <p className="text-[#141118] text-base font-medium leading-normal group-hover:text-purple-600 transition-colors">
            {vendor.name}
          </p>
          <p className="text-[#756388] text-sm font-normal leading-normal">
            {vendor.city}, {vendor.state}
          </p>
        </div>
      </div>
    </Link>
  );
}
