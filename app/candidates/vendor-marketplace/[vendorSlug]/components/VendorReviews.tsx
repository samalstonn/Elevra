import * as React from "react";
import { PublicVendorProfileData } from "@/types/vendor";
import ReviewCard from "./ReviewCard"; // Import the card component
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react"; // Import icons for the stats section

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

      {/* Overall review stats - thumbs up/down counts */}
      <div className="flex flex-wrap gap-4 px-4 py-2">
        <div className="flex items-center justify-center gap-2 px-3 py-2">
          <ThumbsUp className="h-6 w-6 text-[#756388]" />
          <p className="text-[#756388] text-[13px] font-bold leading-normal tracking-[0.015em]">
            10
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 px-3 py-2">
          <ThumbsDown className="h-6 w-6 text-[#756388]" />
          <p className="text-[#756388] text-[13px] font-bold leading-normal tracking-[0.015em]">
            2
          </p>
        </div>
      </div>

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
