import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialCard } from "./TestimonialCard";
import { VendorProfileTestimonial } from "@/types/vendor";

interface VendorTestimonialsProps {
  testimonials: VendorProfileTestimonial[];
}

export function VendorTestimonials({ testimonials }: VendorTestimonialsProps) {
  if (!testimonials || testimonials.length === 0) {
    return null; // Don't render if no testimonials
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Testimonials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* List layout for testimonials */}
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
