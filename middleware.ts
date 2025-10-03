import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { API_LOG_TOKEN_HEADER } from "@/lib/logging/constants";

// Define protected routes
const isPrivateRoute = createRouteMatcher([
  "/candidates/candidate-dashboard(.*)", // Candidate dashboard
  "/vendors/vendor-dashboard(.*)", // Vendor dashboard
  "/admin(.*)", // All admin routes
  "/dashboard(.*)", // All dashboard routes
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (
    req.method !== "OPTIONS" &&
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/internal/log")
  ) {
    try {
      const logUrl = new URL("/api/internal/log", req.url);
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      const loggingToken = process.env.API_LOG_TOKEN;
      if (loggingToken) {
        headers[API_LOG_TOKEN_HEADER] = loggingToken;
      }
      await fetch(logUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          method: req.method,
          pathname,
          timestamp: new Date().toISOString(),
        }),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Failed to record API call", error);
    }
  }

  const { userId, sessionClaims } = await auth();

  // Protect private routes - require authentication
  if (isPrivateRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    const client = await clerkClient();

    const user = await client.users.getUser(userId);

    const isSubAdmin = user.privateMetadata?.isSubAdmin;
    const isAdmin = user.privateMetadata?.isAdmin;

    if (pathname.startsWith("/admin")) {
      const subAdminAllowed = [
        "/admin/sub-admin",
        "/admin/upload-spreadsheet",
        "/admin/candidate-outreach",
        "/admin/search",
      ];

      // Allow admins to access everything under /admin
      if (isAdmin) {
        return NextResponse.next();
      }

      const hasSubAdminAccess = subAdminAllowed.some((path) => {
        return pathname === path || pathname.startsWith(`${path}/`);
      });

      if (isSubAdmin && hasSubAdminAccess) {
        return NextResponse.next();
      }

      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Apply middleware to all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run middleware for API routes
    "/(api|trpc)(.*)",
  ],
};
