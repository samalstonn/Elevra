import React from "react";
import Image from "next/image"; // Using Next.js Image for optimization
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio"; // For consistent image sizing
import { VendorProfilePortfolioItem } from "@/types/vendor";

interface PortfolioItemCardProps {
  item: VendorProfilePortfolioItem;
}

export function PortfolioItemCard({ item }: PortfolioItemCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
      {/* Portfolio Item Image */}
      {item.imageUrl && (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title || "Portfolio item"}
            fill // Use fill for AspectRatio
            className="rounded-t-md object-cover"
            // Add placeholder and error handling
            // placeholder="blur"
            // blurDataURL="data:..." // Low-res placeholder
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src =
                "[https://placehold.co/600x400/eee/ccc?text=Image+Not+Found](https://www.google.com/search?q=https://placehold.co/600x400/eee/ccc%3Ftext%3DImage%2BNot%2BFound)";
            }}
          />
        </AspectRatio>
      )}
      {/* Portfolio Item Details */}
      <div className="p-4">
        <CardTitle className="text-md font-semibold mb-1 text-gray-800">
          {item.title}
        </CardTitle>
        {item.description && (
          <CardDescription className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </CardDescription>
        )}
      </div>
    </Card>
  );
}
