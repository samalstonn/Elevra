"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumCampaignCardProps {
  className?: string;
  variant?: "default" | "compact";
}

const premiumFeatures = [
  "Premium Campaign Page",
  "Top of Google Search Results",
  "Advanced Analytics",
  "Verified Endorsements",
  "Priority Support",
];

export function PremiumCampaignCard({
  className,
  variant = "default",
}: PremiumCampaignCardProps) {
  const features = premiumFeatures;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col justify-between rounded-xl border-2 border-dashed overflow-hidden",
        "bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50",
        "border-purple-300 shadow-sm backdrop-blur transition hover:shadow-lg hover:border-purple-400",
        "group",
        className
      )}
    >
      {/* Sparkle Decorations */}
      <div className="absolute top-4 left-4 opacity-60">
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>
      <div className="absolute bottom-4 right-4 opacity-40">
        <Star className="w-3 h-3 text-blue-400" />
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {variant === "compact" ? "Unlock Premium" : "Upgrade to Premium"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {variant === "compact"
                ? "Advanced campaign features"
                : "Supercharge your campaign with professional tools"}
            </p>
          </div>
        </div>

        {variant === "default" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-60" />
                <span className="text-sm text-gray-600 italic">
                  With Additional Features...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-0">
        <Button
          asChild
          variant="default"
          size={variant === "compact" ? "sm" : "default"}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-200 group-hover:shadow-lg"
        >
          <Link href="/candidates/candidate-dashboard/upgrade">
            {variant === "compact" ? "Upgrade Now" : "Upgrade to Premium"}
            <Zap className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
