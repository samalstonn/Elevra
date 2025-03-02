"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    } else if (!authLoading) {
      router.push("/login-page");
    }
  }, [user, authLoading, router]);

  return <LoadingSpinner />;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}