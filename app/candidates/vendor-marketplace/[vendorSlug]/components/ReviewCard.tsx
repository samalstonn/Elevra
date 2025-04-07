import * as React from "react";
import { VendorProfileTestimonial } from "@/types/vendor"; // Type for testimonial data
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns"; // For formatting the date
import { Star } from "lucide-react"; // Import Star icon for ratings

// Define props for the ReviewCard component
interface ReviewCardProps {
  testimonial: VendorProfileTestimonial;
}

export default function ReviewCard({ testimonial }: ReviewCardProps) {
  // Get candidate details
  const candidate = testimonial.candidate;
  const candidateName = candidate?.name || "Anonymous";
  const candidatePhoto = candidate?.photo || undefined; // Use undefined if null/empty

  // Fallback initials for the avatar
  const fallbackInitials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Format the date the review was created
  const reviewDate = testimonial.createdAt
    ? format(new Date(testimonial.createdAt), "yyyy-MM-dd")
    : "";

  return (
    <div className="flex flex-col gap-3 bg-white">
      {/* Reviewer info and date */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={candidatePhoto} alt={candidateName} />
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-[#141118] text-base font-medium leading-normal">
            {candidateName}
          </p>
          <p className="text-[#756388] text-sm font-normal leading-normal">
            {reviewDate}
          </p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < testimonial.rating
                ? "text-[#141118] fill-[#141118]"
                : "text-[#c4bbce]"
            }`}
          />
        ))}
      </div>

      {/* Review content */}
      <p className="text-[#141118] text-base font-normal leading-normal whitespace-pre-wrap">
        {testimonial.content}
      </p>
    </div>
  );
}
