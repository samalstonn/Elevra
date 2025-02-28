"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../lib/auth-context";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    } else if (!authLoading) {
      const successMsg = searchParams.get("success");
      const redirectUrl = successMsg
        ? `/?authModal=login&success=${encodeURIComponent(successMsg)}`
        : "/?authModal=login";
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  return <LoadingSpinner />;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}