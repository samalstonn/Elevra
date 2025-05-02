"use client";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import "../globals.css";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import SearchBar from "../../components/ResultsSearchBar";
import { Toaster } from "@/components/ui/toaster";
import Footer from "../(footer-pages)/Footer";

const inter = Inter({ subsets: ["latin"] });
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  let dashboardLink = "/dashboard";
  if (pathname.startsWith("/candidates")) {
    dashboardLink = "/candidates/candidate-dashboard";
  } else if (pathname.startsWith("/vendors")) {
    dashboardLink = "/vendors/vendor-dashboard";
  }
  const [_isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Check if the current page is the results page to apply special styling

  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <header className="w-full flex items-center justify-between gap-4 px-6 py-6">
              <Link
                href="/"
                className="text-xl sm:text-3xl font-bold text-purple-900 shrink-0"
              >
                Elevra
              </Link>
              {(pathname.startsWith("/results") ||
                pathname.startsWith("/candidate/")) && (
                <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
                  {/* Address button (only desktop) */}
                  {/* <AddressButton showLocation={!isMobile} /> */}
                  {/* Desktop search bar only */}
                  <div className="max-w-4xl w-full hidden md:block">
                    <SearchBar
                      shadow={true}
                      placeholder="Search candidates..."
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 shrink-0">
                <SignedIn>
                  <Button asChild size="sm" className="md:text-base md:p-4">
                    <Link href={dashboardLink}>
                      <span className="hidden md:inline">My Dashboard</span>
                      <span className="md:hidden">📊</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="purple"
                    size="sm"
                    className="md:text-base md:p-4"
                  >
                    <Link href="/live-elections">
                      <span className="hidden md:inline">Live Elections</span>
                      <span className="md:hidden">🗳️</span>
                    </Link>
                  </Button>
                  <UserButton />
                </SignedIn>

                <SignedOut>
                  <Button asChild size="sm" className="md:text-base md:p-4">
                    <Link href={dashboardLink}>
                      <span className="hidden md:inline">My Dashboard</span>
                      <span className="md:hidden">📊</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="purple"
                    size="sm"
                    className="md:text-base md:p-4"
                  >
                    <Link href="/live-elections">
                      <span className="hidden md:inline">Live Elections</span>
                      <span className="md:hidden">🗳️</span>
                    </Link>
                  </Button>
                  <SignInButton />
                </SignedOut>
              </div>
            </header>

            {/* Main Content - Conditional styling for results page */}
            <main
              className={`flex-grow w-full items-start justify-start min-h-[75vh]`}
            >
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
