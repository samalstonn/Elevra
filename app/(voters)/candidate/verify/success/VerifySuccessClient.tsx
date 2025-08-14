"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";

export default function VerifySuccessClient() {
  return (
    <div className="min-h-screen  flex flex-col justify-center items-center px-4 py-16">
      <div className="bg-white p-10 max-w-3xl w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <FaCheckCircle className="text-green-500 text-5xl mb-4" />
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            🎉 You&apos;re Verified on Elevra!
          </h1>
          <p className="text-md text-gray-600 max-w-lg">
            Your candidate profile is live and discoverable to voters. Welcome
            aboard!
          </p>
        </div>

        <div className="text-left text-gray-700 text-sm space-y-5 mb-8 leading-relaxed">
          <p>
            ✏️ <strong>Edit your candidate profile</strong> to ensure it&apos;s
            up-to-date and compelling.
            <br />
            💬 <strong>You have a verified badge</strong> beside your name -
            verified candidates show up higher in search.
            <br />
            📩 <strong>Share your profile</strong> with voters to drive more
            engagement and visibility.
          </p>

          <p>
            You’re ready to engage with voters on Elevra! Please let us know at
            elevracommunity@gmail.com what features are important to you.
          </p>

          <p>
            🙋 We&apos;d love your feedback - reply to your onboarding email or
            contact us anytime with ideas or questions. We&apos;re building
            Elevra for candidates like you, and your input helps shape the
            platform.
          </p>
        </div>

        <Link href="/candidates/candidate-dashboard">
          <Button variant="purple" size="lg" className="px-8 py-3 text-lg">
            Go to Candidate Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
