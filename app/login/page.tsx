"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../lib/auth-context";

// This is now just a redirect page that will redirect to home with login modal
export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user && !authLoading) {
      router.push("/dashboard");
    } 
    // Otherwise, redirect to home with login modal parameter
    else if (!authLoading) {
      const successMsg = searchParams.get("success");
      const redirectUrl = successMsg 
        ? `/?authModal=login&success=${encodeURIComponent(successMsg)}` 
        : "/?authModal=login";
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  // Show loading spinner while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}