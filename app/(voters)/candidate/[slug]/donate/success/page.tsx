"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCheckCircle, FaArrowLeft, FaUser, FaShare } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const candidateSlug = searchParams.get("candidate");
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [donationInfo, setDonationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (!sessionId) {
        setError("No session information found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/session-info?id=${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch session information");
        }

        const data = await response.json();
        setCandidateInfo(data.candidate);
        setDonationInfo(data.donation);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load donation information");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionInfo();
  }, [sessionId]);

  // Share functionality
  const handleShare = async () => {
    if (candidateInfo && navigator.share) {
      try {
        await navigator.share({
          title: `I just supported ${candidateInfo.name}'s campaign!`,
          text: `I just made a donation to support ${candidateInfo.name}'s campaign on Elevra. Check out their campaign and consider supporting them too!`,
          url: `${window.location.origin}/candidate/${candidateInfo.slug}`,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (candidateInfo) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `${window.location.origin}/candidate/${candidateInfo.slug}`
      );
      alert("Campaign link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <FaCheckCircle className="text-green-600 text-5xl" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Your Support!
          </h1>

          {candidateInfo ? (
            <p className="text-lg text-gray-700 mb-6">
              Your donation to {candidateInfo.name}'s campaign has been
              successfully processed. Your support makes a difference in your
              local community.
            </p>
          ) : (
            <p className="text-lg text-gray-700 mb-6">
              Your donation has been successfully processed. Your support makes
              a difference in your local community.
            </p>
          )}

          {donationInfo && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Donation Details
              </h2>
              <div className="flex justify-between border-b border-purple-100 py-2">
                <span className="font-medium">Amount:</span>
                <span>${Number(donationInfo.amount).toFixed(2)}</span>
              </div>
              {donationInfo.processingFee > 0 && (
                <div className="flex justify-between border-b border-purple-100 py-2">
                  <span className="font-medium">Processing Fee:</span>
                  <span>${Number(donationInfo.processingFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-semibold">
                <span>Total:</span>
                <span>
                  $
                  {(
                    Number(donationInfo.amount) +
                    (donationInfo.processingFee
                      ? Number(donationInfo.processingFee)
                      : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className=" p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              What's Next?
            </h2>
            <ul className="text-gray-700 text-left space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span> You'll receive a confirmation
                email with details of your contribution.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span> Your donation will help fund
                campaign activities and community outreach.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span> Consider sharing this campaign
                with friends and family who may also want to support.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            {candidateSlug && (
              <Button
                variant="outline"
                onClick={() => router.push(`/candidate/${candidateSlug}/`)}
                className="flex items-center justify-center gap-2"
              >
                <FaUser /> View Campaign
              </Button>
            )}
            <Button
              variant="purple"
              onClick={handleShare}
              className="flex items-center justify-center gap-2"
            >
              <FaShare /> Share This Campaign
            </Button>
          </div>

          <Button
            variant="ghost"
            asChild
            className="text-purple-600 hover:text-purple-800"
          >
            <Link href="/" className="flex items-center gap-2">
              <FaArrowLeft /> Return to Homepage
            </Link>
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
