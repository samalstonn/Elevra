import * as React from "react";
import { PublicVendorProfileData } from "@/types/vendor";

// Define props for the VendorAbout component
interface VendorAboutProps {
  vendor: PublicVendorProfileData;
}

export default function VendorAbout({ vendor }: VendorAboutProps) {
  return (
    <div>
      <h2 className="text-[#141118] tracking-light text-[28px] font-bold leading-tight px-4 text-left pb-3 pt-5">
        Welcome to {vendor.name}
      </h2>
      <p className="text-[#141118] text-base font-normal leading-normal pb-3 pt-1 px-4 whitespace-pre-wrap">
        {vendor.bio || "No detailed information available."}
      </p>
    </div>
  );
}
