"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type PublicMetadata = {
  isVoter?: boolean;
  isCandidate?: boolean;
  isVendor?: boolean;
  [key: string]: unknown;
};

export default function HeaderButtons({
  pathname,
}: {
  pathname: string;
}) {
  const { user } = useUser();
  const publicMetadata = (user?.publicMetadata ?? {}) as PublicMetadata;

  let dashboardLink = "/candidates/candidate-dashboard";

  if (publicMetadata.isVoter) {
    dashboardLink = "/dashboard";
  } else if (pathname.startsWith("/vendors") || publicMetadata.isVendor) {
    dashboardLink = "/vendors/vendor-dashboard";
  } else {
    dashboardLink = "/candidates/candidate-dashboard";
  }

  const liveElectionsLink = "/live-elections";
  const blogLink = "/blog";

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
          <span className="md:hidden">🗳️</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant="purple"
        className="md:text-base md:p-4"
      >
        <Link href={blogLink}>
          <span className="hidden md:inline">Blog</span>
          <span className="md:hidden">📰</span>
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
