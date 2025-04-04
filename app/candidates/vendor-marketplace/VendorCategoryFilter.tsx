"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming shadcn Select is used
import { ServiceCategoryFilterItem } from "@/types/vendor";

interface VendorCategoryFilterProps {
  categories: ServiceCategoryFilterItem[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function VendorCategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: VendorCategoryFilterProps) {
  // Handle change event from the Select component
  const handleValueChange = (value: string) => {
    // If the "All Categories" option is selected (value is "all"), pass null
    // Otherwise, pass the selected category ID
    onCategoryChange(value === "all" ? null : value);
  };

  return (
    <div>
      <label
        htmlFor="category-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Service Category
      </label>
      <Select
        value={selectedCategoryId ?? "all"} // Use "all" as the value for the placeholder/default
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="category-select" className="w-full">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          {/* Default option to show all categories */}
          <SelectItem value="all">All Categories</SelectItem>
          {/* Map over fetched categories to create SelectItem options */}
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
