import * as React from "react";
import { PublicVendorProfileData } from "@/types/vendor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Heart, MessageSquare } from "lucide-react"; // Icons
import { format } from "date-fns"; // For formatting the join date
import VendorContactFormDialog from "./VendorContactFormDialog"; // Import the dialog component
import { Badge } from "@/components/ui/badge"; // Added badge component

// Define props for the VendorHeader component
interface VendorHeaderProps {
  vendor: PublicVendorProfileData;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  // State to control the visibility of the contact dialog
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);

  // Fallback initials for the avatar
  const fallbackInitials = vendor.name
    ? vendor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "V";

  // Format the join date
  const joinDate = vendor.createdAt
    ? format(new Date(vendor.createdAt), "MMM yyyy")
    : "N/A";

  // Placeholder function for Add to Favorites
  const handleAddToFavorites = () => {
    // TODO: Implement actual Add to Favorites logic (e.g., API call, state update)
    console.log("Add to Favorites clicked for vendor:", vendor.id);
    // Example: Show a toast notification
    // toast({ title: "Added to Favorites!" });
  };

  return (
    <div className="mb-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Left Side: Avatar and Info */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
          <AvatarImage src={vendor.photoUrl ?? undefined} alt={vendor.name} />
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            {vendor.name}
            {
              <BadgeCheck
                className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6"
                aria-label="Verified Vendor"
              />
            }
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {vendor.city}, {vendor.state}
          </p>
          <p className="text-sm text-muted-foreground sm:text-base">
            Joined {joinDate}
          </p>
        </div>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
        <Button
          className="flex-1 bg-[#f2f0f4] text-[#141118] sm:flex-none"
          onClick={() => setIsContactDialogOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Send Message
        </Button>
        <Button variant="purple" onClick={handleAddToFavorites}>
          <Heart className="mr-2 h-4 w-4" />
          Add to Favorites
        </Button>
      </div>

      {/* Contact Form Dialog */}
      <VendorContactFormDialog
        isOpen={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        vendorName={vendor.name}
        vendorId={vendor.id}
      />
    </div>
  );
}
