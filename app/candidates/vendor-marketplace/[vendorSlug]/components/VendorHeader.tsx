// app/(main)/vendors/[vendorSlug]/components/VendorHeader.tsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import {
  Globe,
  MapPin,
  CheckCircle,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { PublicVendorProfileData } from "@/types/vendor";
import { format } from "date-fns"; // For formatting the date

interface VendorHeaderProps {
  vendor: PublicVendorProfileData;
  // We need to pass Dialog's open state and setter if the form is inside the header component itself,
  // but it's cleaner to have the Dialog wrapper in the parent page component.
  // So, we just need the DialogTrigger here.
}

export function VendorHeader({ vendor }: VendorHeaderProps) {
  // Get the primary service category name (if available)
  const primaryCategory = vendor.serviceCategories?.[0]?.name || "Vendor";
  // Format the joined date
  const joinedDate = vendor.createdAt
    ? format(new Date(vendor.createdAt), "MMMM yyyy")
    : "N/A";

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Vendor Avatar/Logo */}
      <Avatar className="h-24 w-24 border-2 border-gray-300">
        <AvatarImage
          src={vendor.photoUrl || undefined}
          alt={`${vendor.name} logo/photo`}
        />
        <AvatarFallback className="text-2xl bg-gray-200 text-gray-600">
          {vendor.name?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Vendor Info */}
      <div className="flex-1 space-y-1 text-center sm:text-left">
        {/* Vendor Name & Verification Badge */}
        <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
          <span>{vendor.name}</span>
          {vendor.verified && (
            <Badge
              variant="outline"
              className="border-blue-600 text-blue-600 text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </h1>
        {/* Primary Category */}
        <p className="text-md text-gray-600">{primaryCategory}</p>
        {/* Location & Joined Date */}
        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-x-3 gap-y-1 justify-center sm:justify-start flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 inline-block" /> {vendor.city},{" "}
            {vendor.state}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3 inline-block" /> Joined{" "}
            {joinedDate}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 justify-center sm:justify-start">
          {/* Contact Button (Triggers Dialog) */}
          <DialogTrigger asChild>
            <Button size="sm">
              <MessageSquare className="mr-2 h-4 w-4" /> Contact Vendor
            </Button>
          </DialogTrigger>

          {/* Website Link */}
          {vendor.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="mr-2 h-4 w-4" /> Website
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
