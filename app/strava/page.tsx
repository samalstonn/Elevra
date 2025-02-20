"use client";

import { useState } from "react";
import Link from "next/link";

export default function StravaPage() {
  interface User {
    firstName: string;
  }

  const [user, setUser] = useState<User | null>(null);

  const handleStravaLogin = () => {
    // Redirect to Strava OAuth
    const CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
    const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=read,activity:read`;

    window.location.href = STRAVA_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center p-10">
        <h1 className="text-4xl font-bold text-gray-900">Welcome</h1>
        <p className="mt-4 text-gray-600">
          Connect your Strava account.
        </p>
      </div>

      {/* Strava Login Button */}
      {!user ? (
        <button
          onClick={handleStravaLogin}
          className="bg-orange-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-orange-600 transition"
        >
          Connect with Strava
        </button>
      ) : (
        <div>
          <p className="text-gray-700 mt-4">Welcome, {user.firstName}!</p>
          <Link href="/dashboard">
            <button className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg">
              Go to Dashboard
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}