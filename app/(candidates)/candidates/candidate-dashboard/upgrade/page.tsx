"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Star, Zap } from "lucide-react"; // Icons
import { useToast } from "@/hooks/use-toast";
import getStripe from "@/lib/get-stripe"; // Your Stripe utility
// import { useAuth } from "@clerk/nextjs"; // To check current plan later
import { usePageTitle } from "@/lib/usePageTitle";

// Define the features for each plan
const freeFeatures = [
  "Dashboard Overview",
  "Basic Profile Settings",
  "Basic Analytics",
  "1 Profile Photo",
];

const premiumFeatures = [
  ...freeFeatures.filter(
    (f) =>
      f !== "1 Profile Photo" &&
      f !== "Dashboard Overview" &&
      f !== "Basic Analytics" &&
      f !== "Basic Profile Settings" &&
      !f.includes("Limited")
  ), // Inherit non-limited free features
  "Advanced Analytics",
  "Donation Tracking & Management",
  "Video Uploads & Management",
  "Verified Endorsement Management",
  "Multiple Profile Photos",
  "Priority Support",
  "Vendor Discovery Access",
  "Mailing List Management",
];

// Define Plan structure (replace placeholder priceId with your actual Stripe Price ID)
const plans = [
  {
    name: "Free",
    price: "$0",
    interval: "/ month",
    features: freeFeatures,
    isCurrent: true, // Placeholder: Determine this based on user's actual plan
    cta: "Current Plan",
    stripePriceId: null,
  },
  {
    name: "Premium",
    price: "$20",
    interval: "/ month",
    features: premiumFeatures,
    isCurrent: false, // Placeholder: Determine this based on user's actual plan
    cta: "Upgrade to Premium",
    stripePriceId:
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_CANDIDATE_PRICE_ID ||
      "price_placeholder_premium_candidate", // Use environment variable
    highlight: true, // Optional: Highlight the premium plan
  },
  // Add more plans here if needed (e.g., Annual)
];

export interface Plan {
  name: string;
  price: string;
  interval: string;
  features: string[];
  isCurrent?: boolean;
  cta?: string;
  stripePriceId?: string | null; // Optional for free plan
  highlight?: boolean; // Optional for highlighting
}

export default function UpgradePage() {
  usePageTitle("Candidate Dashboard – Upgrade");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Fetch user's current subscription status from Clerk/DB
  // const { user } = useUser();
  // const currentPlan = user?.publicMetadata?.subscriptionTier || 'Free';
  const currentPlan = "Free"; // Placeholder

  const handleUpgradeClick = async (plan: Plan) => {
    if (!plan.stripePriceId || plan.isCurrent) return; // Don't proceed if no price ID or already current

    setIsLoading(true);
    try {
      // Prepare item for Stripe Checkout API
      const cartItems = [
        {
          name: `${plan.name} Candidate Plan`,
          price: parseFloat(plan.price.replace("$", "")), // Extract price number
          quantity: 1,
          // Important: Pass the Stripe Price ID to your API
          priceId: plan.stripePriceId,
        },
      ];

      // Call your API endpoint to create a checkout session
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItems }), // Send necessary data
      });

      const sessionData = await response.json();

      if (!response.ok || !sessionData.sessionId) {
        throw new Error(
          sessionData.error || "Failed to create checkout session."
        );
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe.js failed to load.");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionData.sessionId,
      });

      if (error) {
        console.error("Stripe redirect error:", error);
        throw new Error(error.message || "Failed to redirect to Stripe.");
      }
      // If redirection fails without an error object, it might be blocked by browser
      toast({
        title: "Redirecting to payment...",
        description:
          "If you are not redirected automatically, please check your browser settings.",
        variant: "default",
      });
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setIsLoading(false); // Ensure loading state is reset on error
    }
    // Note: setIsLoading(false) might not be reached if redirect is successful
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Upgrade Your Account
        </h1>
        <p className="text-lg text-gray-600">
          Unlock powerful features to enhance your campaign by upgrading to
          Premium.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col h-full ${
              plan.highlight
                ? "border-blue-500 border-2 shadow-lg"
                : "shadow-sm"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 right-4 z-10">
                <Badge
                  variant="default"
                  className="bg-blue-600 text-white px-3 py-1 text-sm font-medium"
                >
                  <Star className="w-3 h-3 mr-1 inline-block" /> Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                {plan.name}
              </CardTitle>
              <CardDescription className="flex items-baseline pt-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {plan.price}
                </span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600 ml-1">
                  {plan.interval}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm leading-6 text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3 items-start">
                    <Check
                      className="h-5 w-5 flex-none text-blue-600 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Button
                className="w-full"
                onClick={() => handleUpgradeClick(plan)}
                disabled={
                  isLoading ||
                  plan.name.toLowerCase() === currentPlan.toLowerCase()
                } // Disable button for current plan or while loading
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
              >
                {isLoading && plan.stripePriceId ? "Processing..." : plan.cta}
                {plan.highlight && !plan.isCurrent && (
                  <Zap className="ml-2 h-4 w-4" />
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
