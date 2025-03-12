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
import { Button } from "../components/ui";
import { Inter } from "next/font/google";
import Link from "next/link";
import './globals.css';
import { Analytics } from "@vercel/analytics/react"
import { usePathname } from "next/navigation";
import SearchBar from "../components/ResultsSearchBar";
import { useState } from 'react';

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
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const [desktopLocationOpen, setDesktopLocationOpen] = useState(false);

  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <header className="w-full flex items-center justify-between gap-4 px-6 py-6">
              <Link href="/" className="text-3xl font-bold text-purple-900 shrink-0">
                Elevra
              </Link>

                {(pathname.startsWith("/results") || pathname.startsWith("/candidate/")) && (
                <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
                  {/* Desktop location button with dropdown */}
                  <div className="relative hidden md:flex">
                    <Button
                      variant="ghost"
                      className="items-center text-gray-700 border border-gray-300 rounded-full shadow-sm"
                      onClick={() => setDesktopLocationOpen(prev => !prev)}
                    >
                      📍 Dryden, NY
                    </Button>
                    {desktopLocationOpen && (
                      <div className="absolute left-0 mt-12 w-40 bg-white shadow-md rounded-lg z-10">
                        <button
                          onClick={() => {
                            setDesktopLocationOpen(false);
                            // Optionally update location state to Dryden, NY
                          }}
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                          Dryden, NY
                        </button>
                        <button
                          onClick={() => {
                            setDesktopLocationOpen(false);
                            // Optionally update location state to Lansing, NY
                          }}
                          className="block w-full text-left px-4 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                          Lansing, NY
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Mobile location button with dropdown */}
                  <div className="relative md:hidden">
                    <Button
                      variant="ghost"
                      className="flex items-center text-gray-700 border border-gray-300 rounded-full shadow-sm"
                      onClick={() => setMobileLocationOpen(prev => !prev)}
                    >
                      📍
                    </Button>
                    {mobileLocationOpen && (
                      <div className="absolute left-0 mt-2 w-32 bg-white shadow-md rounded-md z-10">
                        <button
                          onClick={() => {
                            setMobileLocationOpen(false);
                            // Optionally update location state to Dryden, NY
                          }}
                          className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Dryden, NY
                        </button>
                        <button
                          onClick={() => {
                            setMobileLocationOpen(false);
                            // Optionally update location state to Lansing, NY
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Lansing, NY
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Desktop search bar only */}
                  <div className="max-w-4xl w-full hidden md:block">
                    <SearchBar placeholder="Search elections or candidates..." />
                  </div>
                </div>
                )}

              <div className="flex items-center gap-4 shrink-0">
                <SignedIn>
                  <Link href="/dashboard">
                    <Button>
                      <span className="hidden md:inline">My Dashboard</span>
                      <span className="md:hidden">Dashboard</span>
                    </Button>
                  </Link>
                  <UserButton />
                </SignedIn>

                <SignedOut>
                  <Link href="/dashboard">
                    <Button>
                      <span className="hidden md:inline">My Dashboard</span>
                      <span className="md:hidden">Dashboard</span>
                    </Button>
                  </Link>
                  <SignInButton></SignInButton>
                </SignedOut>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full flex items-center justify-center min-h-[75vh]">
              {children}
              <Analytics />
            </main>

            {/* Footer Section */}
            <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
              &copy; {new Date().getFullYear()} Elevra. All rights reserved.
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}