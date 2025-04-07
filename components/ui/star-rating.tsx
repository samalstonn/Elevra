import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

// Define props for the StarRating component
interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number; // The rating value (e.g., 1 to 5)
  totalStars?: number; // Total number of stars to display (default: 5)
  size?: number; // Size of the stars in pixels (default: 16)
  fillColor?: string; // Tailwind class for filled star color (default: text-yellow-400)
  emptyColor?: string; // Tailwind class for empty star color (default: text-gray-300)
}

export default function StarRating({
  rating,
  totalStars = 5,
  size = 16,
  fillColor = "text-yellow-400",
  emptyColor = "text-gray-300",
  className,
  ...props
}: StarRatingProps) {
  // Ensure rating is within bounds
  const clampedRating = Math.max(0, Math.min(rating, totalStars));

  return (
    <div
      className={cn("flex items-center", className)}
      aria-label={`Rating: ${clampedRating} out of ${totalStars} stars`}
      {...props}
    >
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "transition-colors", // Add transition for potential future interactions
              starValue <= clampedRating ? fillColor : emptyColor
            )}
            // Use fill="currentColor" for solid stars if desired,
            // otherwise default Lucide behavior (outline) works well too.
            // For solid stars: fill="currentColor"
          />
        );
      })}
    </div>
  );
}
