"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, // Overview
  User, // Profile Settings
  BarChart3, // Analytics
  Mail, // Mailing Lists
  HandCoins, // Donations (Premium)
  Video, // Videos (Premium)
  Award, // Endorsements (Premium)
  Lock, // Lock icon for premium
  CreditCard, // Upgrade Prompt Link
  Users, // Vendor Marketplace
} from "lucide-react";
import { useAuth } from "@clerk/nextjs"; // To get subscription status later

// Define navigation items
const navItems = [
  // --- Free Tabs ---
  {
    href: "/candidates/candidate-dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    premium: false,
  },
  {
    href: "/candidates/vendor-marketplace",
    label: "Vendor Marketplace",
    icon: Users,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/profile-settings",
    label: "Profile Settings",
    icon: User,
    premium: false,
  },
  {
    href: "/candidates/candidate-dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    premium: false,
  }, // Basic analytics is free
  {
    href: "/candidates/candidate-dashboard/mailing-lists",
    label: "Mailing Lists",
    icon: Mail,
    premium: false,
  },
  // --- Premium Tabs ---
  {
    href: "/candidates/candidate-dashboard/donations",
    label: "Donations",
    icon: HandCoins,
    premium: true,
  },
  {
    href: "/candidates/candidate-dashboard/videos",
    label: "Videos",
    icon: Video,
    premium: true,
  },
  {
    href: "/candidates/candidate-dashboard/endorsements",
    label: "Endorsements",
    icon: Award,
    premium: true,
  },
];

// TODO: Define subscription type check
// Example: const isPremiumUser = userMetadata?.subscription === 'premium';
const isPremiumUser = false; // Placeholder - replace with actual check using Clerk metadata

export function DashboardNav() {
  const pathname = usePathname();
  // TODO: Fetch user metadata to check subscription status
  // const { user } = useUser(); // Or useAuth, currentUser etc.
  // const isPremium = user?.publicMetadata?.subscriptionTier === 'premium'; // Example check

  return (
    <nav className="flex flex-col p-4 space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/candidates/candidate-dashboard" &&
            pathname.startsWith(item.href));
        const isLocked = item.premium && !isPremiumUser;

        // Don't render locked items for now, or render with lock icon/disabled state
        // if (isLocked) return null; // Option 1: Hide locked items

        return (
          <Link
            key={item.href}
            href={isLocked ? "#" : item.href} // Prevent navigation for locked items
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-purple-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              isLocked ? "text-gray-400 cursor-not-allowed opacity-70" : "" // Style locked items
            )}
            aria-disabled={isLocked} // Accessibility for disabled links
            onClick={(e) => isLocked && e.preventDefault()} // Prevent click action if locked
          >
            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isLocked && <Lock className="ml-auto h-3 w-3 text-gray-400" />}
          </Link>
        );
      })}

      {/* Optional: Add an Upgrade Prompt Link if not premium */}
      {!isPremiumUser && (
        <Link
          href="/candidates/candidate-dashboard/upgrade" // Link to your upgrade/pricing page
          className={cn(
            "flex items-center px-3 py-2 mt-4 rounded-md text-sm font-medium transition-colors text-blue-600 hover:bg-blue-50"
          )}
        >
          <CreditCard className="mr-3 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">Upgrade Account</span>
        </Link>
      )}
    </nav>
  );
}
