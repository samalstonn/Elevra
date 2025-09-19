import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { m } from "framer-motion";
import { NextResponse } from "next/server";

// Define protected routes
const isPrivateRoute = createRouteMatcher([
  "/candidates/candidate-dashboard(.*)", // Candidate dashboard
  "/vendors/vendor-dashboard(.*)", // Vendor dashboard
  "/admin(.*)", // All admin routes
  "/dashboard(.*)", // All dashboard routes
]);

export default clerkMiddleware(async (auth, req) => {
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

    const pathname = req.nextUrl.pathname;
    if (pathname.startsWith("/admin")) {
      const subAdminAllowed = [
        "/admin/upload-spreadsheet",
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
