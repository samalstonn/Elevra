import React from "react";
import Link from "next/link"; // Import Link
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, ArrowRight } from "lucide-react"; // Added ArrowRight
import { DiscoveryVendor } from "@/types/vendor"; // Ensure this type includes 'slug'

interface VendorCardProps {
  vendor: DiscoveryVendor; // Make sure DiscoveryVendor includes the 'slug' field
}

export function VendorCard({ vendor }: VendorCardProps) {
  // Construct the profile link using the vendor's slug
  const profileLink = `/candidates/vendor-marketplace/${vendor.slug}`;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg border border-gray-200">
      <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
        {/* Placeholder for Vendor Logo/Image */}
        {/* <div className="w-16 h-16 bg-gray-200 rounded-full mb-3 mx-auto flex items-center justify-center text-gray-400">
           <ImageIcon className="w-8 h-8" />
         </div> */}
        <CardTitle className="text-lg font-semibold text-gray-800 text-center">
          {vendor.name}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 inline-block" /> {vendor.city},{" "}
          {vendor.state}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{vendor.bio}</p>
        <div className="flex flex-wrap gap-2">
          {vendor.serviceCategories.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        {/* Website Link */}
        {vendor.website ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {" "}
              {/* Prevent card link trigger */}
              <Globe className="mr-2 h-4 w-4" /> Website
            </a>
          </Button>
        ) : (
          <div /> // Placeholder to maintain layout alignment
        )}
        {/* View Profile Link/Button */}
        <Button size="sm" asChild>
          <Link href={profileLink}>
            View Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
