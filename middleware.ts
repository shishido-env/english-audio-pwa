import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/~offline",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // ファイル拡張子のあるパスと _next 内部リソースを除外
    "/((?!.+\\.[\\w]+$|_next).*)",
    // API ルートは常に middleware を通す
    "/(api|trpc)(.*)",
    // Clerk auto-proxy
    "/__clerk/(.*)",
  ],
};
