"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "@clerk/nextjs";

// Candidate interface based on Prisma schema
interface Candidate {
  id: number;
  name: string;
  party: string;
  position: string;
  bio: string;
  website?: string;
  linkedin?: string;
  city: string;
  state: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  electionId?: number;
}

export default function CandidateLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<
    null | "success" | "pending" | "rejected" | "error"
  >(null);

  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // Check if the user is already registered as a candidate when component mounts
  useEffect(() => {
    const checkCandidateStatus = async () => {
      if (!isLoaded || !userId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/candidate?clerkUserId=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const candidateData: Candidate = await response.json();
          setCandidate(candidateData);

          if (candidateData.status === "APPROVED") {
            setLoginStatus("success");
            // Redirect to candidate dashboard after successful login
            setTimeout(() => {
              router.push("/candidates/candidate-dashboard");
            }, 1500);
          } else if (candidateData.status === "PENDING") {
            setLoginStatus("pending");
          } else if (candidateData.status === "REJECTED") {
            setLoginStatus("rejected");
          }
        } else if (response.status === 404) {
          // Candidate not found - user needs to sign up
          setCandidate(null);
          setError(
            "You haven't registered as a candidate yet. Please sign up first."
          );
        } else {
          const data = await response.json();
          setError(
            data.error || "An error occurred while checking candidate status"
          );
          setLoginStatus("error");
        }
      } catch (error: unknown) {
        console.error("Error checking candidate status:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoginStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    checkCandidateStatus();
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return <div>Loading authentication...</div>;
  }

  if (!userId) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="mb-4">Please sign in to access your candidate account.</p>
        <Button
          variant="purple"
          onClick={() => router.push("/sign-in?redirect=/candidates")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 max-w-md mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center"
      >
        <h1 className="text-2xl font-bold text-purple-700 mb-4">
          Candidate Portal
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <FaSpinner className="animate-spin text-purple-600 text-3xl mb-4" />
            <p className="text-gray-600">Checking your candidate account...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-left">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 text-xl mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 mb-2">Error</h3>
                <p className="text-gray-700">{error}</p>
                {error.includes("haven't registered") && (
                  <Button
                    variant="purple"
                    className="mt-4"
                    onClick={() => router.push("/candidates?tab=signup")}
                  >
                    Register as a Candidate
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {loginStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
              >
                <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-3" />
                <h3 className="text-xl font-medium text-green-700 mb-2">
                  Login Successful!
                </h3>
                <p className="text-gray-600 mb-4">
                  Welcome back, {candidate?.name}.
                </p>
                <p className="text-gray-600">
                  Redirecting to your dashboard...
                </p>
              </motion.div>
            )}

            {loginStatus === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-700 mb-2">
                  Account Pending Approval
                </h3>
                <p className="text-gray-600 mb-4">
                  Your candidate account is still under review. Once approved,
                  you`&apos;`ll have full access to the candidate dashboard.
                </p>
                <p className="text-gray-600">
                  Thank you for your patience! Please look out for an email from
                  the Elevra team once your account has been approved.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/")}
                >
                  Return to Home
                </Button>
              </div>
            )}

            {loginStatus === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-700 mb-2">
                  Account Not Approved
                </h3>
                <p className="text-gray-600 mb-4">
                  Unfortunately, your candidate account application was not
                  approved at this time.
                </p>
                <p className="text-gray-600">
                  Please contact our support team for more information or to
                  submit additional verification details.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/")}
                >
                  Return to Home
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
