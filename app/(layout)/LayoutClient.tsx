"use client";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  // SignInButton, // Not using this currently, but keeping it for future reference
  UserButton,
  useUser,
} from "@clerk/nextjs";
import "../globals.css";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname, useSearchParams } from "next/navigation";
import SearchBar from "../../components/ResultsSearchBar";
import { Toaster } from "@/components/ui/toaster";
import Footer from "../(footer-pages)/Footer";
import HeaderButtons from "./HeaderButtons";
import SignUpRoleButton, { SIGNUP_ROLE_STORAGE_KEY } from "./SignUpRoleButton";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!clerkKey || clerkKey.trim() === "") {
  throw new Error(
    "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable"
  );
}

const BASE_KEYWORDS = [
  "local elections",
  "municipal elections",
  "county election calendar",
  "city council races",
  "mayoral campaigns",
  "school board elections",
  "candidate portals",
  "campaign promotion",
  "voter guides",
  "election results",
  "elevra community",
  "civic engagement platform",
  "community elections",
];

function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = (() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  return (
    <header className="w-full flex items-center justify-between gap-4 px-6 py-6">
      <Link
        href="/"
        className="text-xl sm:text-3xl font-bold text-purple-800 shrink-0"
      >
        Elevra
      </Link>
      {(pathname.startsWith("/results") ||
        pathname.startsWith("/candidate/")) && (
        <div className="flex-grow flex items-center justify-center gap-4 mx-auto">
          <div className="max-w-4xl w-full hidden md:block">
            <SearchBar shadow={true} placeholder="Search candidates..." />
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 shrink-0">
        <SignedIn>
          <HeaderButtons pathname={pathname} />
          <UserButton afterSignOutUrl={fullPath} />
        </SignedIn>
        <SignedOut>
          <HeaderButtons pathname={pathname} />
          <SignUpRoleButton />
          { /* <SignInButton />  Omitting b/c of the new SignUp Button that opens the modal!*/}
        </SignedOut>
      </div>
    </header>
  );
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [_isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let storedRole: "candidate" | "voter" | null = null;
    try {
      const stored = localStorage.getItem(SIGNUP_ROLE_STORAGE_KEY);
      if (stored === "candidate" || stored === "voter") {
        storedRole = stored;
      }
    } catch (error) {
      console.error("Unable to read stored sign-up role", error);
    }

    if (!storedRole) {
      return;
    }

    type PublicMetadataShape = {
      isCandidate?: boolean;
      isVoter?: boolean;
      [key: string]: unknown;
    };

    const publicMetadata = (user?.publicMetadata ?? {}) as PublicMetadataShape;
    const roleAlreadySet =
      (storedRole === "candidate" && publicMetadata?.isCandidate === true) ||
      (storedRole === "voter" && publicMetadata?.isVoter === true);

    if (roleAlreadySet) {
      try {
        localStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
      } catch (error) {
        console.error("Unable to clear stored sign-up role", error);
      }
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/user/metadata/role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: storedRole }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        try {
          localStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
        } catch (error) {
          console.error("Unable to clear stored sign-up role", error);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to persist Clerk role metadata", error);
        }
      }
    })();

    return () => controller.abort();
  }, [isSignedIn, user]);

  useEffect(() => { // takes keywords from the page and adds them to the meta keywords tag
    const keywordMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="keywords"]'
    );
    if (!keywordMeta) {
      return;
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

    const dynamicKeywords = new Set<string>(BASE_KEYWORDS);

    const titleKeywords = normalize(
      document.title.replace(/\|\s*Elevra$/i, "")
    )
      .split(" ")
      .filter((keyword) => keyword.length > 2);
    titleKeywords.forEach((keyword) => dynamicKeywords.add(keyword));

    const mainElement = document.querySelector("main");
    const mainText = normalize(mainElement?.textContent ?? "");
    if (mainText) {
      const contentKeywords = mainText
        .split(" ")
        .filter((keyword) => keyword.length > 3);

      for (const keyword of contentKeywords) {
        if (dynamicKeywords.size >= BASE_KEYWORDS.length + 40) {
          break;
        }
        dynamicKeywords.add(keyword);
      }
    }

    keywordMeta.setAttribute(
      "content",
      Array.from(dynamicKeywords).join(", ")
    );
  }, [pathname]);

  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased overflow-x-hidden overflow-y-auto">
        {/* Header Section (wrapped in Suspense to support useSearchParams) */}
        <Suspense fallback={null}>
          <HeaderNav />
        </Suspense>

        {/* Main Content - Conditional styling for results page */}
        <main className="flex-1 w-full">{children}</main>

        {/* Footer Section */}
        <Footer />

        {/* Global analytics + toasts */}
        <Analytics />
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkKey || ""}>
      <LayoutShell>{children}</LayoutShell>
    </ClerkProvider>
  );
}
