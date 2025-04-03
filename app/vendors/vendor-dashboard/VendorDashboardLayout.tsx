"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Vendor } from "@prisma/client";
import {
  LayoutDashboard,
  User,
  Images,
  MessageSquare,
  CreditCard,
  BarChart,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface VendorDashboardLayoutProps {
  children: React.ReactNode;
  vendor: Vendor;
}

const navigation = [
  {
    name: "Overview",
    href: "/vendors/vendor-dashboard",
    icon: LayoutDashboard,
  },
  { name: "Profile", href: "/vendors/vendor-dashboard/profile", icon: User },
  {
    name: "Portfolio",
    href: "/vendors/vendor-dashboard/portfolio",
    icon: Images,
  },
  {
    name: "Testimonials",
    href: "/vendors/vendor-dashboard/testimonials",
    icon: MessageSquare,
  },
  {
    name: "Subscription",
    href: "/vendors/vendor-dashboard/subscription",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    href: "/vendors/vendor-dashboard/analytics",
    icon: BarChart,
  },
];

export default function VendorDashboardLayout({
  children,
  vendor,
}: VendorDashboardLayoutProps) {
  const pathname = usePathname();
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
            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
            <nav className="mt-8 flex-1 px-2">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
