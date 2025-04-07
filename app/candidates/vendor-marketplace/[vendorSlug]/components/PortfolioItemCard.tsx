import * as React from "react";
import Image from "next/image";
import { VendorProfilePortfolioItem } from "@/types/vendor"; // Type for portfolio item data

// Define props for the PortfolioItemCard component
interface PortfolioItemCardProps {
  item: VendorProfilePortfolioItem;
}

export default function PortfolioItemCard({ item }: PortfolioItemCardProps) {
  return (
    <div className="flex flex-col gap-3 pb-3">
      <div className="w-full aspect-square relative">
        <Image
          src={
            item.imageUrl ||
            `https://placehold.co/400x400/eee/ccc?text=Placeholder`
          }
          alt={item.title || "Portfolio item"}
          fill // Use fill to make the image cover the container
          className="object-cover rounded-xl" // Using rounded corners as in mockup
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes attribute for optimization
          onError={(e) => {
            // Handle image loading errors
            e.currentTarget.src = `https://placehold.co/400x400/eee/ccc?text=Image+Error`;
            e.currentTarget.srcset = ""; // Clear srcset as well
          }}
        />
      </div>
      <div>
        <p className="text-[#141118] text-base font-medium leading-normal">
          {item.title}
        </p>
        {item.description && (
          <p className="text-[#756388] text-sm font-normal leading-normal">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
