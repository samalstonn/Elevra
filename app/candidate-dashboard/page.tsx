"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign } from "lucide-react";
import { LineChartComponent } from "@/components/ui/line-chart";
import { PieChartComponent } from "@/components/ui/pie-chart";
import { Candidate } from "@prisma/client";

export default function CandidateDashboard() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not signed in
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isSignedIn && user) {
      // Fetch candidate data from our database
      fetch(`/api/candidate?clerkUserId=${user.id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch candidate data');
          }
          return res.json();
        })
        .then(data => {
          setCandidate(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
          // If there's an error fetching candidate data, redirect to signup
          router.push("/sign-up");
        });
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No candidate data found. Please complete registration.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-8 lg:px-16"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800">Welcome Back, {candidate.name}</h1>
        <p className="text-gray-900">Real-time insights on your campaign performance</p>
      </header>

      {/* Status Banner */}
      {!candidate.verified && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            Your account is pending verification. Some features may be limited until verification is complete.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium text-gray-500">Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-green-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium text-gray-500">Donors</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">325</div>
            <p className="text-xs text-green-500 mt-1">+18% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Donation History</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <LineChartComponent />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Donor Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PieChartComponent />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}