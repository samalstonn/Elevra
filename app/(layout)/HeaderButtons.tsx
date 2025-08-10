import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export default function HeaderButtons({ pathname }: { pathname: string }) {
  let dashboardLink = "/candidates/candidate-dashboard";
  if (pathname.startsWith("/candidates")) {
    dashboardLink = "/candidates/candidate-dashboard";
  } else if (pathname.startsWith("/vendors")) {
    dashboardLink = "/vendors/vendor-dashboard";
  }
  const liveElectionsLink = "/live-elections";

  return (
    <div className="flex items-center gap-4">
      <Button
        asChild
        size="sm"
        variant="purple"
        className="md:text-base md:p-4"
      >
        <Link href={liveElectionsLink}>
          <span className="hidden md:inline">Live Elections</span>
          <span className="md:hidden">📊</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant="purple"
        className="md:text-base md:p-4"
      >
        <Link href={dashboardLink}>
          <span className="hidden md:inline">Blog</span>
          <span className="md:hidden">📊</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant="purple"
        className="md:text-base md:p-4"
      >
        <Link href={dashboardLink}>
          <span className="hidden md:inline">My Dashboard</span>
          <span className="md:hidden">📊</span>
        </Link>
      </Button>
    </div>
  );
}
