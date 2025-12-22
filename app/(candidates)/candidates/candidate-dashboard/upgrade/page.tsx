"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { usePageTitle } from "@/lib/usePageTitle";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

// Define the features for each plan
const freeFeatures = ["Discoverable Profile", "Verified Checkmark"];

const premiumFeatures = [
  "Premium Campaign Website",
  "Gain Exposure as Uncontested Candidate",
  "Donation Management and Compliance",
  "Advanced Analytics (Views, Demographics, etc.)",
  "Top of Google Search Results",
  "Verified Endorsements",
  "Keep Profile After Election",
];

const conciergeFeatures = [
  "All Premium Features",
  "Generated Campaign Media",
  "Find the Best Advertising Options",
  "Assurance with Compliance and Filing",
  "Connect with Campaign Vendors",
];

const planDefinitions = [
  {
    name: "Free",
    price: "$0",
    interval: "/ Month",
    features: freeFeatures,
    tier: "free" as const,
  },
  {
    name: "Premium",
    price: "$10",
    interval:
      "/ Month through November 2026 \nTop Profiles Received 100x More Views",
    features: premiumFeatures,
    tier: "premium" as const,
    highlight: true, // Optional: Highlight the premium plan
  },
  {
    name: "Concierge",
    price: "",
    interval: "Inquire at team@elevracommunity.com",
    features: conciergeFeatures,
    tier: "concierge" as const,
  },
];

export type CandidatePlanTier = "free" | "premium" | "concierge";

export interface Plan {
  name: string;
  price: string;
  interval: string;
  features: string[];
  tier: CandidatePlanTier;
  isCurrent?: boolean;
  cta?: string;
  highlight?: boolean;
}

export default function UpgradePage() {
  usePageTitle("Candidate Dashboard – Upgrade");
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<CandidatePlanTier | null>(
    null
  );
  const [handledStatus, setHandledStatus] = useState<string | null>(null);

  const currentPlan = useMemo<CandidatePlanTier>(() => {
    if (!user?.publicMetadata?.candidateSubscriptionTier) {
      return "free";
    }

    const tier = String(
      user.publicMetadata.candidateSubscriptionTier
    ).toLowerCase();

    return tier === "premium" ? "premium" : "free";
  }, [user?.publicMetadata?.candidateSubscriptionTier]);

  useEffect(() => {
    const status = searchParams?.get("status");
    if (!status || handledStatus === status) return;
    if (status === "success" && !isLoaded) return;

    const handleStatus = async () => {
      if (status === "success") {
        try {
          await user?.reload?.();
        } catch (error) {
          console.error("Failed to reload user after upgrade", error);
        }
        toast({
          title: "Upgrade Successful",
          description: "You now have access to all premium features.",
        });
      }

      if (status === "cancelled") {
        toast({
          title: "Checkout Cancelled",
          description: "No changes were made to your subscription.",
        });
      }

      setHandledStatus(status);
      router.replace("/candidates/candidate-dashboard/upgrade");
    };

    void handleStatus();
  }, [handledStatus, isLoaded, router, searchParams, toast, user]);

  const plans = useMemo<Plan[]>(() => {
    return planDefinitions.map((definition) => {
      const isCurrent = definition.tier === currentPlan;
      const plan: Plan = {
        ...definition,
        isCurrent,
        cta: isCurrent
          ? "Current Plan"
          : definition.tier === "free"
          ? "Included"
          : `Upgrade to ${definition.name}`,
      };

      return plan;
    });
  }, [currentPlan]);

  const handleUpgradeClick = async (plan: Plan) => {
    if (plan.tier === "free" || plan.isCurrent || loadingPlan) {
      return;
    }

    if (plan.tier === "concierge") {
      window.location.href = "/feedback";
      return;
    }

    setLoadingPlan(plan.tier);
    try {
      const response = await fetch("/api/candidate/upgrade-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: plan.tier }),
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

      toast({
        title: "Redirecting to payment...",
        description:
          "If you are not redirected automatically, please check your browser settings.",
      });
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col h-full ${
              plan.highlight
                ? "border-purple-700 border-2 shadow-lg"
                : "shadow-sm"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 right-4 z-10">
                <Badge
                  variant="default"
                  className="bg-purple-700 text-white px-3 py-1 text-sm font-medium"
                >
                  <Star className="w-3 h-3 mr-1 inline-block" /> Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                {plan.name}
              </CardTitle>
              <CardDescription className="pt-1">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600 ml-1">
                    {plan.interval.split("\n")[0]}
                  </span>
                </div>
                <div className="text-sm italic font-normal text-gray-600 ml-1 mt-2">
                  {plan.interval.split("\n")[1]}
                </div>
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
                className={`w-full ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-200 group-hover:shadow-lg"
                    : ""
                }`}
                onClick={() => handleUpgradeClick(plan)}
                disabled={
                  plan.tier === "free" ||
                  loadingPlan !== null ||
                  plan.isCurrent ||
                  (!isLoaded && plan.tier === "premium")
                }
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
              >
                {loadingPlan === plan.tier ? "Processing..." : plan.cta}
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
