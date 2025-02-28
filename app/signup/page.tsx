"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

// This is now just a redirect page that will redirect to home with signup modal
export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user && !authLoading) {
      router.push("/dashboard");
    } 
    // Otherwise, redirect to home with signup modal parameter
    else if (!authLoading) {
      router.push("/?authModal=signup");
    }
  }, [user, authLoading, router]);

  // Show loading spinner while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}