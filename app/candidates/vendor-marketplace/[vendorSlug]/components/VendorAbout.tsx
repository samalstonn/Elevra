// app/(main)/vendors/[vendorSlug]/components/VendorAbout.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VendorAboutProps {
  bio: string | null;
}

export function VendorAbout({ bio }: VendorAboutProps) {
  if (!bio) {
    return null; // Don't render the section if there's no bio
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          About
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render bio text, preserving whitespace and line breaks */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{bio}</p>
      </CardContent>
    </Card>
  );
}
