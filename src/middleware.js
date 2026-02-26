import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only protect specific routes or protect all and exclude
// We will protect everything EXCEPT sign-in and sign-up
const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/analyze(.*)', // optionally, might want to keep public if called from external, but usually good to protect internal
    '/manifest(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
