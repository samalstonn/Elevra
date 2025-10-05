"use client";
import React, { useState } from "react";
import { DashboardNav } from "../../../../components/DashboardNav";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, // Overview
  User, // Profile Settings
  BarChart3, // Analytics
  Award, // Endorsements (Premium)
  Users, // Vendor Marketplace
  Menu,
  Zap,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Define the structure of the dashboard layout
export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser(); // Or useAuth, currentUser etc.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const candidateTier = (
    user?.publicMetadata?.candidateSubscriptionTier as string | undefined
  )?.toLowerCase();

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
