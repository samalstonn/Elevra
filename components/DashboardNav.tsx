"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Lock, // Lock icon for premium
} from "lucide-react";
// import { useAuth } from "@clerk/nextjs"; // To get subscription status later

interface navItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  premium?: boolean; // Optional property to indicate if the tab is premium
}

type DashboardNavProps = {
  navItems: navItem[];
  person: string;
};

// TODO: Define subscription type check
// Example: const isPremiumUser = userMetadata?.subscription === 'premium';
const isPremiumUser = false; // Placeholder - replace with actual check using Clerk metadata

export function DashboardNav({ navItems, person }: DashboardNavProps) {
  const user = person;
  const pathname = usePathname();
  // TODO: Fetch user metadata to check subscription status
  // const { user } = useUser(); // Or useAuth, currentUser etc.
  // const isPremium = user?.publicMetadata?.subscriptionTier === 'premium'; // Example check

  return (
    <nav className="flex flex-col p-4 space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== `/${user}s/${user}-dashboard` &&
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
                ? "bg-purple-100 text-purple-700"
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
      {/* {!isPremiumUser && (
        <Link
          href={`/${user}s/${user}-dashboard/upgrade`} // Link to your upgrade/pricing page
          className={cn(
            "flex items-center px-3 py-2 mt-4 rounded-md text-sm font-medium transition-colors text-blue-600 hover:bg-blue-50"
          )}
        >
          <CreditCard className="mr-3 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">Upgrade Account</span>
        </Link>
      )} */}
    </nav>
  );
}
