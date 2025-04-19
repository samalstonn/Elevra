// /candidate/[slug]/donate/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { TabButton } from "@/components/ui/tab-button";
import { Button } from "@/components/ui/button";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import DonationAmountTab from "./DonationAmountTab";
import DonorInfoTab from "./DonorInfoTab";
import getStripe from "@/lib/get-stripe";
import { calculateFee } from "@/lib/functions";

interface Candidate {
  id: number;
  name: string;
}

export default function DonatePage() {
  const { slug } = useParams();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"amount" | "info">("amount");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donation form state
  const [formState, setFormState] = useState({
    amount: 0,
    coverFee: false,
    email: "",
    fullName: "",
    address: "",
    aptNumber: "", // Added aptNumber to formState
    city: "",
    state: "",
    zip: "",
    country: "USA",
    phone: "",
    isRetiredOrUnemployed: false,
    occupation: "",
    employer: "",
    agreedToTerms: false,
  });

  // Tab completion tracking
  const [isAmountTabComplete, setIsAmountTabComplete] = useState(false);

  useEffect(() => {
    // Only run this after auth is loaded and user is logged in
    if (isLoaded && userId) {
      const savedState = localStorage.getItem("donationFormState");
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          setFormState((prev) => ({
            ...prev,
            ...parsedState,
          }));

          if (parsedState.amount > 0) {
            setIsAmountTabComplete(true);
          }
        } catch (e) {
          console.error("Error parsing saved form state:", e);
        }

        // Clear after using
        localStorage.removeItem("donationFormState");
      }
      // Auto-switch to Donor Info tab if amount is already set
      if (formState.amount > 0) {
        setActiveTab("info");
      }
    }
  }, [isLoaded, userId, formState.amount]);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/candidate/slug?slug=${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch candidate");
        }
        const data = await response.json();
        setCandidate(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load candidate information");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCandidate();
    }
  }, [slug]);

  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : "";

      setFormState((prev) => ({
        ...prev,
        email: primaryEmail,
        fullName: fullName,
      }));
    }
  }, [user]);

  const handleAmountSubmit = (amount: number, coverFee: boolean) => {
    setFormState((prev) => ({
      ...prev,
      amount,
      coverFee,
    }));
    setIsAmountTabComplete(true);
    setActiveTab("info");
  };

  const handleDonorInfoChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationSelect = (
    city: string,
    state: string,
    fullAddress: string
  ) => {
    // Extract zip code from address if possible
    const zipMatch = fullAddress.match(/\b\d{5}(?:-\d{4})?\b/);
    const zip = zipMatch ? zipMatch[0] : "";

    setFormState((prev) => ({
      ...prev,
      address: fullAddress,
      city,
      state,
      zip,
    }));
  };

  const handleDonationSubmit = async () => {
    try {
      setLoading(true);

      const processingFee = calculateFee(formState.amount);
      const totalAmount = formState.coverFee
        ? formState.amount + processingFee
        : formState.amount;

      // Create cart item for Stripe checkout
      const cartItems = [
        {
          name: `Donation to ${candidate?.name}'s Campaign`,
          price: totalAmount,
          quantity: 1,
        },
      ];

      // Create a checkout session
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItems,
          donationDetails: {
            candidateId: candidate?.id,
            donorInfo: {
              ...formState,
              processingFee: processingFee,
            },
          },
          candidateSlug: slug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Failed to initialize Stripe");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe redirect error:", error);
        setError("Payment processing error. Please try again.");
      }
    } catch (error) {
      console.error("Error processing donation:", error);
      setError("An error occurred while processing your donation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-4">{error || "Candidate not found"}</p>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center w-full mx-auto mb-8 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl py-8"
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <Link href={`/candidate/${slug}`}>
              <FaArrowLeft /> Back to Candidate
            </Link>
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6">
            Support {candidate.name}&apos;s Campaign
          </h1>

          <div className="flex justify-center space-x-4 mb-8">
            <div className="flex flex-col items-center">
              <TabButton
                active={activeTab === "amount"}
                onClick={() => setActiveTab("amount")}
              >
                <span className="flex items-center gap-1">
                  Donation Amount
                  {isAmountTabComplete && (
                    <FaCheckCircle className="ml-2 text-green-500" />
                  )}
                </span>
              </TabButton>
            </div>
            <div
              className={
                !isAmountTabComplete ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <TabButton
                active={activeTab === "info"}
                onClick={() => isAmountTabComplete && setActiveTab("info")}
              >
                <span>Donor Information</span>
              </TabButton>
            </div>
          </div>

          {activeTab === "amount" && (
            <DonationAmountTab
              onSubmit={handleAmountSubmit}
              initialAmount={formState.amount}
              initialCoverFee={formState.coverFee}
            />
          )}

          {activeTab === "info" && (
            <DonorInfoTab
              formState={formState}
              onChange={handleDonorInfoChange}
              onLocationSelect={handleLocationSelect}
              onSubmit={handleDonationSubmit}
              isUserSignedIn={!!userId}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
