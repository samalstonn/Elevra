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
import { Button } from "../components/ui/button";
import { Inter } from "next/font/google";
import Link from "next/link";
import './globals.css';
import { Analytics } from "@vercel/analytics/react"
import { usePathname } from "next/navigation";
import SearchBar from "../components/ResultsSearchBar";


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

                {(pathname.startsWith("/results") || pathname.startsWith("/candidate")) && (
                <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
                  <Button
                  variant="ghost"
                  onClick={() => {
                    // Placeholder for address change functionality
                  }}
                  >
                  📍 Dryden, NY
                  </Button>
                  <div className="max-w-4xl w-full">
                  <SearchBar placeholder="Search elections or candidates..." />
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