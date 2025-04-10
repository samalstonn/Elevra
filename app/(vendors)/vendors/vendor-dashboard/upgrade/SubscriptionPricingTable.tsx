"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorTier } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const tiers = [
  {
    name: "Basic",
    id: VendorTier.FREE,
    price: 0,
    description: "Essential features for getting started",
    features: [
      "Basic vendor profile",
      "Limited visibility",
      "Up to 3 portfolio items",
      "Basic analytics",
      "Standard support",
    ],
    notIncluded: [
      "Enhanced visibility",
      "Lead analytics",
      "Verified badge eligibility",
      "Priority support",
      "Promoted listings",
    ],
  },
  {
    name: "Standard",
    id: VendorTier.STANDARD,
    price: 50,
    description: "Everything in Basic plus enhanced features",
    features: [
      "Enhanced vendor profile",
      "Improved visibility in search",
      "Up to 10 portfolio items",
      "Lead analytics",
      "Verified badge eligibility",
      "Priority support",
    ],
    notIncluded: [
      "Premium visibility",
      "Promoted listings",
      "Campaign engagement stats",
    ],
  },
  {
    name: "Premium",
    id: VendorTier.PREMIUM,
    price: 150,
    description: "All features for maximum visibility",
    features: [
      "Premium vendor profile",
      "Top visibility in search",
      "Unlimited portfolio items",
      "Advanced lead analytics",
      "Campaign engagement stats",
      "Verified badge included",
      "Promoted listings",
      "VIP support",
    ],
    notIncluded: [],
  },
];

interface SubscriptionPricingTableProps {
  currentPlan: VendorTier;
}

export default function SubscriptionPricingTable({
  currentPlan,
}: SubscriptionPricingTableProps) {
  const [upgradingTier, setUpgradingTier] = useState<VendorTier | null>(null);

  const { toast } = useToast();

  const handleUpgrade = async (tierId: VendorTier) => {
    // Only allow upgrading to higher tiers
    if (
      (currentPlan === VendorTier.FREE &&
        (tierId === VendorTier.STANDARD || tierId === VendorTier.PREMIUM)) ||
      (currentPlan === VendorTier.STANDARD && tierId === VendorTier.PREMIUM)
    ) {
      setUpgradingTier(tierId);

      try {
        // For the purposes of this implementation, we'll just show a mock checkout
        // This would be replaced with a real Stripe checkout integration

        // Create a mock cart item for Stripe checkout
        // const cartItems = [
        //   {
        //     name: `${
        //       tierId.charAt(0) + tierId.slice(1).toLowerCase()
        //     } Vendor Subscription (Monthly)`,
        //     price: tierId === VendorTier.STANDARD ? 5000 : 15000, // in cents
        //     quantity: 1,
        //   },
        // ];

        // Simulate an API call to create a checkout session
        setTimeout(() => {
          toast({
            title: "Checkout Ready",
            description:
              "This is a placeholder for Stripe checkout integration.",
            action: (
              <ToastAction altText="Ok" onClick={() => setUpgradingTier(null)}>
                Ok
              </ToastAction>
            ),
          });
          setUpgradingTier(null);
        }, 2000);

        // In a real implementation, we would:
        // 1. Call an API to create a Stripe checkout session
        // 2. Redirect to the Stripe checkout page
        // 3. Handle the webhook callback to update the subscription

        /* 
        // Example of a real implementation:
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems,
            vendorId,
            tierId,
          }),
        });

        const { sessionId } = await response.json();
        
        // Redirect to checkout
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId });
        */
      } catch (error) {
        console.error("Error upgrading plan:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was a problem processing your upgrade request.",
        });
        setUpgradingTier(null);
      }
    } else if (currentPlan === tierId) {
      toast({
        title: "Current Plan",
        description: "You are already subscribed to this plan.",
      });
    } else {
      // Cannot downgrade
      toast({
        variant: "destructive",
        title: "Cannot Downgrade",
        description:
          "Please contact support if you need to downgrade your subscription.",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`rounded-lg border p-6 ${
            currentPlan === tier.id
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="mb-4">
            {currentPlan === tier.id && (
              <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-md mb-2">
                Current Plan
              </span>
            )}
            <h3 className="text-lg font-bold">{tier.name}</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-bold">${tier.price}</span>
              <span className="ml-1 text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{tier.description}</p>
          </div>

          <ul className="mt-6 space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}

            {tier.notIncluded.map((feature) => (
              <li key={feature} className="flex items-start opacity-50">
                <X className="h-5 w-5 text-gray-400 shrink-0 mr-3" />
                <span className="text-sm text-gray-500">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button
              variant={currentPlan === tier.id ? "outline" : "default"}
              className="w-full"
              disabled={
                upgradingTier !== null ||
                currentPlan === tier.id ||
                currentPlan === VendorTier.PREMIUM ||
                (currentPlan === VendorTier.STANDARD &&
                  tier.id === VendorTier.FREE)
              }
              onClick={() => handleUpgrade(tier.id)}
            >
              {upgradingTier === tier.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : currentPlan === tier.id ? (
                "Current Plan"
              ) : (
                `Upgrade to ${tier.name}`
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
