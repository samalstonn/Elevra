"use client";
import React from "react";
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
} from "lucide-react";

const navItems = [
  // --- Free Tabs ---
  {
    href: "/candidates/candidate-dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/bio-settings",
    label: "My Profile",
    icon: User,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/profile-settings",
    label: "My Elections",
    icon: Users,
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
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {user?.firstName || "Candidate"}!
          </h2>
          {/* Maybe add user name/avatar here later */}
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardNav navItems={navItems} person={"candidate"} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
