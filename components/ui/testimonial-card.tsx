import React from "react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

export function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="text-3xl text-purple-200 mb-4">`&quot;`</div>
      <p className="text-gray-700 italic mb-4">{quote}</p>
      <div className="flex items-center">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-900 font-bold mr-3">
          {author.charAt(0)}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{author}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
    </div>
  );
}
