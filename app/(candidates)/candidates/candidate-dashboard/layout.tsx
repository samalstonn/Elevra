"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNav } from "../../../../components/DashboardNav";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, // Overview
  User, // Profile Settings
  BarChart3, // Analytics
  Award, // Endorsements (Premium)
  Users, // Vendor Marketplace
  Menu,
  Megaphone,
  Zap,
  HandCoins,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Define the structure of the dashboard layout
export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser(); // Or useAuth, currentUser etc.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const publicMetadata = (user?.publicMetadata ?? {}) as {
    isCandidate?: boolean;
    isVoter?: boolean;
    candidateSubscriptionTier?: string;
    [key: string]: unknown;
  };

  const candidateTier = (
    publicMetadata.candidateSubscriptionTier as string | undefined
  )?.toLowerCase();
  const isVoterOnly =
    publicMetadata.isVoter === true && publicMetadata.isCandidate !== true;

  const handleBecomeCandidate = async () => {
    if (isConverting) return;
    setConvertError(null);
    setIsConverting(true);
    try {
      const response = await fetch("/api/user/metadata/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "candidate" }),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      if (user) {
        await user.reload();
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to switch account to candidate", error);
      setConvertError(
        "We couldn't switch your role right now. Please try again."
      );
    } finally {
      setIsConverting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
        <span
          className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500"
          aria-label="Loading candidate dashboard"
        />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 px-6">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-purple-100 bg-white/90 p-10 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900">
            Sign in required
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to access the candidate dashboard.
          </p>
          <Button variant="purple" asChild className="justify-center">
            <Link href="/sign-in?redirect_url=/candidates/candidate-dashboard">
              Sign in
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isVoterOnly) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 px-6 py-12">
        <div className="w-full max-w-lg space-y-6 rounded-3xl border border-purple-100 bg-white/95 p-10 text-center shadow-xl backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <Megaphone className="h-7 w-7 text-purple-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Switch to the candidate experience
          </h1>
          <p className="text-sm text-muted-foreground">
            You&apos;re currently set up as a voter. Update your role to unlock
            campaign tools, analytics, and outreach automations.
          </p>
          {convertError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {convertError}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="purple"
              size="lg"
              className="justify-center gap-2"
              onClick={handleBecomeCandidate}
              disabled={isConverting}
            >
              {isConverting ? "Switching..." : "Join as a candidate"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-center"
              asChild
            >
              <Link href="/dashboard">Stay in voter mode</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mx-auto text-purple-600 hover:text-purple-700"
            asChild
          >
            <Link href="/candidates?tab=home">
              Learn about candidate features
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    // --- Free Tabs ---
    {
      href: "/candidates/candidate-dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      premium: false,
    },
    {
      href: "/candidates/candidate-dashboard/my-profile",
      label: "Profile",
      icon: User,
      premium: false,
    },
    {
      href: "/candidates/candidate-dashboard/my-elections",
      label: candidateTier === "premium" ? "Premium Campaign" : "Campaign",
      icon: Users,
      premium: false,
    },
    {
      href: "/candidates/candidate-dashboard/endorsements",
      label: "Endorsements",
      icon: Award,
      premium: true,
      requiresPremiumUnlock: true,
    },
    {
      href: "/candidates/candidate-dashboard/donations",
      label: "Donations",
      icon: HandCoins,
      premium: true,
      requiresPremiumUnlock: true,
    },
    {
      href: "/candidates/candidate-dashboard/analytics",
      label: "Analytics",
      icon: BarChart3,
      premium: true,
      requiresPremiumUnlock: true,
    },
    {
      href: "/candidates/candidate-dashboard/upgrade",
      label: "Upgrade Plan",
      icon: Zap,
      cta: true,
    },
  ];

  const navItemsToRender =
    candidateTier === "premium"
      ? navItems
          .map((item) =>
            item.requiresPremiumUnlock
              ? { ...item, premium: false, requiresPremiumUnlock: false }
              : item
          )
          .filter(
            (item) => item.href !== "/candidates/candidate-dashboard/upgrade"
          )
      : navItems;

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-visible">
      {/* Mobile Menu Hamburger */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            className="md:hidden fixed top-16 left-4 z-50 p-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">
            <div className="px-4 py-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-purple-700">
                  Elevra
                </h2>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">
                  {user?.firstName || "Candidate"}
                </p>
              </div>
            </div>
            <DashboardNav navItems={navItemsToRender} person="candidate" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {user?.firstName || "Candidate"}!
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardNav navItems={navItemsToRender} person="candidate" />
        </div>
      </aside>

      {/* Main Content Area - Full Width on Mobile */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-x-visible">
        {children}
      </main>
    </div>
  );
}
