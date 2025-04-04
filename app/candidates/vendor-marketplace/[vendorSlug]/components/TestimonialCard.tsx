import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react"; // Star icon for rating
import { VendorProfileTestimonial } from "@/types/vendor";
import { formatDistanceToNow } from "date-fns"; // For relative date formatting

interface TestimonialCardProps {
  testimonial: VendorProfileTestimonial;
}

// Helper function to render star ratings
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-4 h-4 ${
          i <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
      />
    );
  }
  return <div className="flex">{stars}</div>;
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  // Format the date nicely (e.g., "about 2 months ago")
  const datePosted = formatDistanceToNow(new Date(testimonial.createdAt), {
    addSuffix: true,
  });

  return (
    <Card className="bg-white border border-gray-200 shadow-sm p-4">
      <CardHeader className="flex flex-row items-center space-x-3 p-0 mb-3">
        {/* Candidate Avatar */}
        <Avatar className="h-10 w-10 border">
          <AvatarImage
            src={testimonial.candidate?.photo || undefined}
            alt={testimonial.candidate?.name}
          />
          <AvatarFallback>
            {testimonial.candidate?.name?.charAt(0).toUpperCase() || "C"}
          </AvatarFallback>
        </Avatar>
        {/* Candidate Name and Rating */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">
            {testimonial.candidate?.name || "Anonymous Candidate"}
          </p>
          {/* Display Star Rating */}
          {renderStars(testimonial.rating)}
        </div>
      </CardHeader>
      <CardContent className="p-0 mb-2">
        {/* Testimonial Content */}
        <p className="text-sm text-gray-700 italic">"{testimonial.content}"</p>
      </CardContent>
      <CardFooter className="p-0">
        {/* Date Posted */}
        <p className="text-xs text-gray-500">{datePosted}</p>
      </CardFooter>
    </Card>
  );
}
