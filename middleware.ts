import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isPrivateRoute = createRouteMatcher([
  "/candidate/verify(.*)", // Verification page
  "/candidate-dashboard(.*)", // Candidate dashboard
  "/vendor-dashboard(.*)", // Vendor dashboard
  "/admin(.*)", // All admin routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Special case for admin-debug and setup-admin
  // if (req.nextUrl.pathname === '/admin-debug' ||
  //     req.nextUrl.pathname === '/setup-admin') {
  //   return NextResponse.next();
  // }

  // Protect private routes - require authentication
  if (isPrivateRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Get user type from metadata
    const metadata =
      (sessionClaims?.metadata as { userType?: string; isAdmin?: boolean }) ||
      {};
    const userType = metadata.userType;
    const isAdmin = metadata.isAdmin === true;

    // Protect candidate dashboard - only for candidate users
    if (
      req.nextUrl.pathname.startsWith("/candidate-dashboard") &&
      userType !== "candidate"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect vendor dashboard - only for vendor users
    if (
      req.nextUrl.pathname.startsWith("/vendor-dashboard") &&
      userType !== "vendor"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect admin routes - only for admin users
    // But skip the protection check for the debug and setup pages
    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      req.nextUrl.pathname !== "/admin-debug" &&
      req.nextUrl.pathname !== "/setup-admin" &&
      !isAdmin
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Post-authentication redirection based on user type
  if (userId && req.nextUrl.pathname === "/") {
    const metadata =
      (sessionClaims?.metadata as { userType?: string; isAdmin?: boolean }) ||
      {};
    const userType = metadata.userType;
    const isAdmin = metadata.isAdmin === true;

    // Redirect admin users to admin dashboard
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (userType === "candidate") {
      return NextResponse.redirect(new URL("/candidate-dashboard", req.url));
    }

    if (userType === "vendor") {
      return NextResponse.redirect(new URL("/vendor-dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Apply middleware to all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run middleware for API routes
    "/(api|trpc)(.*)",
  ],
};
