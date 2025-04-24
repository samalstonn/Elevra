import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitRequest } from "./lib/api/rate-limit";
import { handleApiError } from "./lib/api/errors/error-handler";

// Define protected routes
const isPrivateRoute = createRouteMatcher([
  "/candidates/candidate-dashboard(.*)", // Candidate dashboard
  "/vendors/vendor-dashboard(.*)", // Vendor dashboard
  "/admin(.*)", // All admin routes
  "/dashboard(.*)", // All dashboard routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Only apply to API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return middleware(req);
  }

  // Protect private routes - require authentication
  if (isPrivateRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    const client = await clerkClient();

    const user = await client.users.getUser(userId);

    const isAdmin = user.privateMetadata?.isAdmin;

    if (req.url.includes("/admin") && !isAdmin) {
      // redirect to homepage
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

export async function middleware(request: NextRequest) {
  try {
    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith("/api/v1/")) {
      // Public API endpoints
      const result = await rateLimitRequest(request, {
        limit: 60, // 60 requests
        window: 60, // per minute
      });

      // If rate limit was applied and successful, add headers
      if (result) {
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", result.limit.toString());
        response.headers.set(
          "X-RateLimit-Remaining",
          result.remaining.toString()
        );
        response.headers.set("X-RateLimit-Reset", result.reset.toISOString());
        return response;
      }
    }

    // Continue to the route handler
    return NextResponse.next();
  } catch (error) {
    // Handle any errors (including rate limit errors)
    return handleApiError(error);
  }
}
