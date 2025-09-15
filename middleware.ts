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

    if (req.url.includes("/admin/upload-spreadsheet")) {
      // allow sub-admins OR admins
      if (!isSubAdmin && !isAdmin) {
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }
    } else if (req.url.includes("/admin")) {
      // only admins can access other /admin routes
      if (!isAdmin) {
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }
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
