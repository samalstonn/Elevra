import * as React from "react";
import { PublicVendorProfileData } from "@/types/vendor";
import PortfolioItemCard from "./PortfolioItemCard"; // Import the card component

// Define props for the VendorPortfolio component
interface VendorPortfolioProps {
  vendor: PublicVendorProfileData;
}

export default function VendorPortfolio({ vendor }: VendorPortfolioProps) {
  const portfolioItems = vendor.portfolio || []; // Ensure portfolioItems is an array

  return (
    <div>
      <h2 className="text-[#141118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
        Portfolio
      </h2>
      {portfolioItems.length > 0 ? (
        // Grid layout matching the mockup
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
          {portfolioItems.map((item) => (
            <PortfolioItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        // Message shown when there are no portfolio items
        <p className="text-muted-foreground px-4">
          This vendor hasn&apos;t added any portfolio items yet.
        </p>
      )}
    </div>
  );
}
