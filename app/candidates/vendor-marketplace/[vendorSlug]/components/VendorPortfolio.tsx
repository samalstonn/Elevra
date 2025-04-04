// app/(main)/vendors/[vendorSlug]/components/VendorPortfolio.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioItemCard } from "./PortfolioItemCard";
import { VendorProfilePortfolioItem } from "@/types/vendor";

interface VendorPortfolioProps {
  items: VendorProfilePortfolioItem[];
}

export function VendorPortfolio({ items }: VendorPortfolioProps) {
  if (!items || items.length === 0) {
    return null; // Don't render if no items
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid layout for portfolio items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <PortfolioItemCard key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
