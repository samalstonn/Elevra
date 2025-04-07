"use client";

import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TestimonialsListProps {
  testimonials: Array<{
    id: number;
    content: string;
    rating: number;
    createdAt: Date;
    candidate: {
      id: number;
      name: string;
      position: string;
      city?: string | null;
      state?: string | null;
    };
  }>;
}

export default function TestimonialsList({
  testimonials,
}: TestimonialsListProps) {
  if (testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No testimonials yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Testimonials help build trust with potential clients. Request
          testimonials from candidates you&apos;ve worked with.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {testimonials.map((testimonial) => (
        <Card key={testimonial.id} className="relative">
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center">
            <span className="font-bold">{testimonial.rating}</span>
          </div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border bg-gray-100">
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  {testimonial.candidate.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-2">
                  <h4 className="font-semibold text-lg">
                    {testimonial.candidate.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {testimonial.candidate.position}
                    {testimonial.candidate.city &&
                      testimonial.candidate.state && (
                        <>
                          {" "}
                          • {testimonial.candidate.city},{" "}
                          {testimonial.candidate.state}
                        </>
                      )}
                  </p>
                </div>
                <div className="flex mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="relative mt-4">
                  <p className="text-gray-700 italic pt-2">
                    &quot;{testimonial.content}&quot;
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-xs text-gray-500">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
