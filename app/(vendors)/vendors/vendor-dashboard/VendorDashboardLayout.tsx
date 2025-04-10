"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Vendor } from "@prisma/client";
import {
  LayoutDashboard,
  User,
  Images,
  MessageSquare,
  BarChart,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { DashboardNav } from "@/components/DashboardNav";

interface VendorDashboardLayoutProps {
  children: React.ReactNode;
  vendor: Vendor;
}

const navItems = [
  {
    label: "Overview",
    href: "/vendors/vendor-dashboard",
    icon: LayoutDashboard,
    premium: false,
  },
  {
    label: "Profile",
    href: "/vendors/vendor-dashboard/profile",
    icon: User,
    premium: false,
  },
  {
    label: "Portfolio",
    href: "/vendors/vendor-dashboard/portfolio",
    icon: Images,
    premium: false,
  },
  {
    label: "Testimonials",
    href: "/vendors/vendor-dashboard/testimonials",
    icon: MessageSquare,
    premium: true,
  },
  {
    label: "Analytics",
    href: "/vendors/vendor-dashboard/analytics",
    icon: BarChart,
    premium: true,
  },
];

export default function VendorDashboardLayout({
  children,
  vendor,
}: VendorDashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed top-4 left-4 z-50 p-2"
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">{vendor.name}</p>
                <div className="flex mt-1">
                  <Badge
                    variant={vendor.verified ? "success" : "warning"}
                    className="text-xs"
                  >
                    {vendor.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
            <DashboardNav navItems={navItems} person={"vendor"} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="mt-4 px-4">
              <p className="text-sm font-medium">{vendor.name}</p>
              <div className="flex mt-1">
                <Badge
                  variant={vendor.verified ? "success" : "warning"}
                  className="text-xs"
                >
                  {vendor.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
            <DashboardNav navItems={navItems} person={"vendor"} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
