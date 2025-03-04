import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', // Sign-in page
  '/sign-up(.*)', // Sign-up page
  '/',            // Home page
  "/not-found",   // 404 page
  '/results(.*)',   // Results page
  '/candidate(.*)',   // Results page
]);

export default clerkMiddleware(async (auth, req) => {
  // all routes public for now
  // if (!isPublicRoute(req)) {
  //   await auth.protect();
  // }
});

export const config = {
  matcher: [
    // Apply middleware to all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run middleware for API routes
    '/(api|trpc)(.*)',
  ],
};