// /candidate/verify/error/page.tsx

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification Failed",
};

export default function VerifyErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Verification Failed
        </h1>
        <p className="mb-6 text-gray-700">
          We encountered an error verifying your profile. Please try again or
          contact support.
        </p>
        <Link href="/">
          <p className="text-purple-600 underline">Return to Home</p>
        </Link>
      </div>
    </div>
  );
}
