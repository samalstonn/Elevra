"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CandidateImage } from "@/components/CandidateImage";
import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaShare } from "react-icons/fa";
import { Edit } from "lucide-react";

type CandidateProfileCandidate = {
  name: string;
  slug: string;
  currentRole?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  verified?: boolean | null;
  clerkUserId?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
};

interface CandidateProfileHeaderProps {
  candidate: CandidateProfileCandidate;
  verified?: boolean;
  isEditable?: boolean;
  showShareButton?: boolean;
  showVerifyButton?: boolean;
  onVerify?: () => void | Promise<void>;
  isVerifyPending?: boolean;
}

export function CandidateProfileHeader({
  candidate,
  verified,
  isEditable = false,
  showShareButton = true,
  showVerifyButton = true,
  onVerify,
  isVerifyPending = false,
}: CandidateProfileHeaderProps) {
  const [showVerificationTooltip, setShowVerificationTooltip] = useState(false);
  const publicPhoto = candidate.photo ?? candidate.photoUrl ?? null;
  const clerkUserId = candidate.clerkUserId ?? null;
  const isVerified =
    typeof verified === "boolean" ? verified : Boolean(candidate.verified);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/candidate/${candidate.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${candidate.name}'s campaign on Elevra!`,
          url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
    }
  }, [candidate.name, candidate.slug]);

  const desktopShareButton = showShareButton ? (
    <Button
      variant="purple"
      className="flex items-center gap-2"
      size="md"
      onClick={handleShare}
    >
      <FaShare /> Share Profile
    </Button>
  ) : null;

  const mobileShareButton = showShareButton ? (
    <Button
      variant="purple"
      className="flex justify-center items-center gap-1 text-sm px-2"
      size="sm"
      onClick={handleShare}
    >
      <FaShare className="h-3 w-3" /> Share
    </Button>
  ) : null;

  const desktopVerificationButton =
    showVerifyButton && !isVerified && onVerify ? (
      <Button
        variant="purple"
        size="md"
        onClick={onVerify}
        disabled={isVerifyPending}
        className="flex items-center gap-2"
      >
        <FaCheckCircle />
        <span>{isVerifyPending ? "Working..." : "This is me"}</span>
      </Button>
    ) : null;

  const mobileVerificationButton =
    showVerifyButton && !isVerified && onVerify ? (
      <Button
        variant="purple"
        size="sm"
        onClick={onVerify}
        disabled={isVerifyPending}
        className="flex justify-center items-center gap-1 text-sm px-2"
      >
        <FaCheckCircle className="h-3 w-3" />
        <span>{isVerifyPending ? "..." : "This is me"}</span>
      </Button>
    ) : null;

  return (
    <div className="flex flex-col items-center md:flex-row md:items-start md:text-left text-center gap-4">
      <CandidateImage
        clerkUserId={clerkUserId}
        publicPhoto={publicPhoto}
        name={candidate.name}
        width={150}
        height={150}
        className="md:w-[150px] md:h-[150px] w-[80px] h-[80px]"
      />
      <div className="pl-2">
        <h1 className="mt-2 text-xl font-bold text-gray-900 flex items-center md:justify-start justify-center gap-2">
          {candidate.name}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setShowVerificationTooltip(true)}
            onMouseLeave={() => setShowVerificationTooltip(false)}
            onClick={() => setShowVerificationTooltip((prev) => !prev)}
          >
            <FaCheckCircle className={isVerified ? "text-blue-500" : "text-gray-400"} />
            {showVerificationTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                {isVerified
                  ? "This candidate has verified their information"
                  : "This candidate has not verified their information"}
              </div>
            )}
          </div>
        </h1>
        <p className="text-sm font-semibold text-purple-600">
          {candidate.currentRole}
        </p>
        {candidate.currentCity && candidate.currentState ? (
          <p className="text-sm font-medium text-gray-500">
            {candidate.currentCity}, {candidate.currentState}
          </p>
        ) : null}

        {/* Desktop actions */}
        <div className="mt-4 hidden md:flex justify-start gap-4">
          {isEditable ? (
            <Button variant="outline" asChild>
              <Link href="/candidates/candidate-dashboard/my-profile">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          ) : null}
          {desktopShareButton}
          {desktopVerificationButton}
        </div>

        {/* Mobile actions */}
        <div className="mt-4 gap-2 md:hidden flex justify-center">
          {isEditable ? (
            <Button
              variant="outline"
              asChild
              className="flex justify-center text-sm px-2"
            >
              <Link href="/candidates/candidate-dashboard/my-profile">
                <Edit className="mr-1 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          ) : null}
          {mobileShareButton}
          {mobileVerificationButton}
        </div>
      </div>
    </div>
  );
}
