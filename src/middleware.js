import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Allow viewing the application and public demo routes
const isPublicRoute = createRouteMatcher([
    '/',
    '/scan(.*)',
    '/log(.*)',
    '/analytics(.*)',
    '/insights(.*)',
    '/goals(.*)',
    '/profile(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api(.*)',
    '/manifest(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    // If route is not public, require auth
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
