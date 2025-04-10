"use client"; // Mark this as a Client Component

import * as React from "react";
import { useState } from "react";
import type { PublicVendorProfileData } from "@/types/vendor"; // Type for vendor data

// --- Import Actual Components ---
import VendorHeader from "./components/VendorHeader";
import VendorAbout from "./components/VendorAbout";
import VendorPortfolio from "./components/VendorPortfolio";
import VendorReviews from "./components/VendorReviews";

// Define props for the client component
interface VendorProfileClientProps {
  vendor: PublicVendorProfileData;
}

// Define the possible tab values
type TabValue = "about" | "portfolio" | "reviews";

export default function VendorProfileClient({
  vendor,
}: VendorProfileClientProps) {
  // State to manage the currently active tab
  const [activeTab, setActiveTab] = useState<TabValue>("about"); // Default to 'about' tab

  // Define the tabs configuration
  const tabs: { value: TabValue; label: string }[] = [
    { value: "about", label: "Home" }, // Changed from "About" to "Home" to match mockup
    { value: "portfolio", label: "Portfolio" },
    { value: "reviews", label: "Reviews" },
  ];

  return (
    // Main container with padding and max-width, matching previous implementation
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Render the Vendor Header */}
      <VendorHeader vendor={vendor} />

      {/* Tab Navigation Area */}
      <div
        className="flex border-b border-[#e0dce5] justify-between"
        aria-label="Vendor profile sections"
      >
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 cursor-pointer ${
              activeTab === tab.value
                ? "border-b-[#141118] text-[#141118]"
                : "border-b-transparent text-[#756388]"
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            <p
              className={`text-sm font-bold leading-normal tracking-[0.015em] ${
                activeTab === tab.value ? "text-[#141118]" : "text-[#756388]"
              }`}
            >
              {tab.label}
            </p>
          </div>
        ))}
      </div>
      <VendorAbout vendor={vendor} />
      <VendorPortfolio vendor={vendor} />
      <VendorReviews vendor={vendor} />

      {/* Conditionally Rendered Content Area */}
      <div className="mt-6">
        {/* {activeTab === "about" && <VendorAbout vendor={vendor} />}
        {activeTab === "portfolio" && <VendorPortfolio vendor={vendor} />}
        {activeTab === "reviews" && <VendorReviews vendor={vendor} />} */}
      </div>
    </div>
  );
}
