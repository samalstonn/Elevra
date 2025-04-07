import * as React from "react";
import { PublicVendorProfileData } from "@/types/vendor";
import ReviewCard from "./ReviewCard"; // Import the card component
import { Button } from "@/components/ui/button";

// Define props for the VendorReviews component
interface VendorReviewsProps {
  vendor: PublicVendorProfileData;
}

export default function VendorReviews({ vendor }: VendorReviewsProps) {
  const testimonials = vendor.testimonials || []; // Ensure testimonials is an array

  // Placeholder function for "See All Reviews"
  const handleSeeAllReviews = () => {
    // TODO: Implement navigation or logic to show all reviews
    console.log("See All Reviews clicked for vendor:", vendor.id);
    // Example: Navigate to a dedicated reviews page
    // router.push(`/vendors/${vendor.slug}/reviews`);
  };

  return (
    <div>
      <h2 className="text-[#141118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
        Reviews
      </h2>

      {testimonials.length > 0 ? (
        <div className="flex flex-col gap-8 overflow-x-hidden p-4">
          {/* List of Review Cards */}
          {testimonials.map((testimonial) => (
            <ReviewCard key={testimonial.id} testimonial={testimonial} />
          ))}

          {/* "See All Reviews" Button */}
          {testimonials.length >= 3 && (
            <div className="flex px-4 py-3">
              <Button
                variant="outline"
                className="flex-1 bg-[#f2f0f4] text-[#141118] text-sm font-bold tracking-[0.015em]"
                onClick={handleSeeAllReviews}
              >
                See All Reviews
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Message shown when there are no reviews
        <p className="text-muted-foreground px-4">
          This vendor doesn&apos;t have any reviews yet.
        </p>
      )}
    </div>
  );
}
