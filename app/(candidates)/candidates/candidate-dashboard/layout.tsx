"use client";
import React, { useState } from "react";
import { DashboardNav } from "../../../../components/DashboardNav";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, // Overview
  User, // Profile Settings
  BarChart3, // Analytics
  Mail, // Mailing Lists
  HandCoins, // Donations (Premium)
  Video, // Videos (Premium)
  Award, // Endorsements (Premium)
  Users, // Vendor Marketplace
  Menu,
  StickyNote,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
    label: "My Profile",
    icon: User,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/my-elections",
    label: "My Elections",
    icon: Users,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/my-page",
    label: "My Page",
    icon: StickyNote,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/endorsements",
    label: "Endorsements",
    icon: Award,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/donations",
    label: "Donations",
    icon: HandCoins,
    premium: true,
  },
  // --- Premium Tabs ---
  {
    href: "/candidates/vendor-marketplace",
    label: "Vendor Marketplace",
    icon: Users,
    premium: true,
  },
  {
    href: "/candidates/candidate-dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    premium: true,
  },
  {
    href: "/candidates/candidate-dashboard/mailing-lists",
    label: "Mailing Lists",
    icon: Mail,
    premium: true,
  },

  {
    href: "/candidates/candidate-dashboard/videos",
    label: "Videos",
    icon: Video,
    premium: true,
  },
];

// Define the structure of the dashboard layout
export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser(); // Or useAuth, currentUser etc.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
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
            <DashboardNav navItems={navItems} person="candidate" />
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
          <DashboardNav navItems={navItems} person="candidate" />
        </div>
      </aside>

      {/* Main Content Area - Full Width on Mobile */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
