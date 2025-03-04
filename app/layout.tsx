import type { Metadata } from "next";
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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elevra",
};

export const dynamic = "force-dynamic";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <header className="w-full flex items-center justify-between p-4">
              <Link href="/" className="text-3xl font-bold text-purple-900">
                Elevra
              </Link>

              <div className="flex items-center gap-4">
                <SignedIn>
                  <Link href="/dashboard">
                    <Button>My Dashboard</Button>
                  </Link>
                  <UserButton />
                </SignedIn>

                <SignedOut>
                  <SignInButton mode="redirect">
                    <Button>My Dashboard</Button>
                  </SignInButton>
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