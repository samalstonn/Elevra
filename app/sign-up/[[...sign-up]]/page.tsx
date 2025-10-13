"use client";

import { SignUp } from "@clerk/nextjs";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_REDIRECT = "/dashboard";

const resolveRedirect = (value: string | null): string => {
  if (!value) {
    return DEFAULT_REDIRECT;
  }
  if (value.startsWith("/")) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // ignore malformed URLs and fall back to default
  }
  return DEFAULT_REDIRECT;
};

export default function Page() {
  const searchParams = useSearchParams();

  const role = useMemo(() => {
    const roleParam = searchParams.get("role");
    return roleParam === "candidate" ? "candidate" : "voter";
  }, [searchParams]);

  const redirect = useMemo(() => {
    const candidate = searchParams.get("redirect");
    // We cannot call window in server; guard inside memo
    if (typeof window !== "undefined") {
      return resolveRedirect(candidate);
    }
    return DEFAULT_REDIRECT;
  }, [searchParams]);

  const redirectQuery = useMemo(() => {
    const params = new URLSearchParams({
      role,
      redirect,
    });
    return params.toString();
  }, [redirect, role]);

  const signInPath = useMemo(() => {
    const params = new URLSearchParams({ redirect_url: redirect });
    return `/sign-in?${params.toString()}`;
  }, [redirect]);

  const afterSignUpPath = useMemo(
    () => `/auth/complete-sign-up?${redirectQuery}`,
    [redirectQuery]
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <SignUp
          signInUrl={signInPath}
          afterSignInUrl={redirect}
          afterSignUpUrl={afterSignUpPath}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white p-8 border-none shadow-none",
              headerTitle: "text-xl font-bold text-center mb-6 text-purple-700",
              headerSubtitle: "text-center text-gray-600",
              formButtonPrimary:
                "w-full bg-purple-700 text-white py-3 rounded-lg hover:bg-purple-800 transition disabled:opacity-70",
              formFieldInput:
                "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700",
              formFieldLabel: "text-gray-700 font-medium",
              footerActionText: "text-gray-700",
              footerActionLink:
                "text-purple-700 font-medium hover:text-purple-800",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
              socialButtonsBlockButton:
                "border border-gray-300 hover:bg-gray-50",
              socialButtonsBlockButtonText: "text-gray-700 font-medium",
              socialButtonsBlockButtonArrow: "text-gray-500",
              alert: "text-red-600 text-sm",
            },
            layout: {
              socialButtonsPlacement: "bottom",
            },
            variables: {
              colorPrimary: "#6D28D9",
              colorText: "#374151",
              colorTextSecondary: "#6B7280",
              colorBackground: "#F9FAFB",
              fontFamily: "system-ui, -apple-system, sans-serif",
              borderRadius: "0.375rem",
            },
          }}
        />
      </div>
    </div>
  );
}
