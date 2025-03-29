"use client";

// import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import SearchBar from "../components/ResultsSearchBar";
import AddressButton from "../components/AddressButton";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Elevra",
// };

export const dynamic = "force-dynamic";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState<boolean>(false);
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
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <header className="w-full flex items-center justify-between gap-4 px-6 py-6">
              <Link
                href="/"
                className="text-3xl font-bold text-purple-900 shrink-0"
              >
                Elevra
              </Link>
              {(pathname.startsWith("/results") ||
                pathname.startsWith("/candidate/")) && (
                <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
                  {/* Address button (only desktop) */}
                  <AddressButton showLocation={!isMobile} />
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
                  <Button asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </Button>
                  <UserButton />
                </SignedIn>

                <SignedOut>
                  <Button asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </Button>
                  <SignInButton></SignInButton>
                </SignedOut>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full flex items-center justify-center min-h-[75vh]">
              {children}
              <Analytics />
              <SpeedInsights />
            </main>

            {/* Footer Section */}
            <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
              <div>
                &copy; {new Date().getFullYear()} Elevra. All rights reserved.
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
