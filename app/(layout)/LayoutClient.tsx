"use client";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import "../globals.css";
import { useState, useEffect, Suspense } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname, useSearchParams } from "next/navigation";
import SearchBar from "../../components/ResultsSearchBar";
import { Toaster } from "@/components/ui/toaster";
import Footer from "../(footer-pages)/Footer";
import HeaderButtons from "./HeaderButtons";

const inter = Inter({ subsets: ["latin"] });
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = (() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  return (
    <header className="w-full flex items-center justify-between gap-4 px-6 py-6">
      <Link
        href="/"
        className="text-xl sm:text-3xl font-bold text-purple-800 shrink-0"
      >
        Elevra
      </Link>
      {(pathname.startsWith("/results") || pathname.startsWith("/candidate/")) && (
        <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
          <div className="max-w-4xl w-full hidden md:block">
            <SearchBar shadow={true} placeholder="Search candidates..." />
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 shrink-0">
        <SignedIn>
          <HeaderButtons pathname={pathname} />
          <UserButton afterSignOutUrl={fullPath} />
        </SignedIn>
        <SignedOut>
          <HeaderButtons pathname={pathname} />
          <SignInButton />
        </SignedOut>
      </div>
    </header>
  );
}

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <html lang="en">
        <body className={`${inter.className} overflow-x-hidden`}>
          {/* Prevent global horizontal scroll */}
          <div className="flex flex-col min-h-screen">
            {/* Header Section (wrapped in Suspense to support useSearchParams) */}
            <Suspense fallback={null}>
              <HeaderNav />
            </Suspense>

            {/* Main Content - Conditional styling for results page */}
            <main className={`flex-grow w-full items-start justify-start min-h-[75vh] overflow-x-hidden`}>
              {children}
              <Analytics />
              <SpeedInsights />
              <Toaster />
            </main>

            {/* Footer Section */}
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
