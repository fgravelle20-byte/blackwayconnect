import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/:locale/dashboard(.*)",
  "/admin(.*)",
  "/:locale/admin(.*)",
  "/onboarding(.*)",
  "/:locale/onboarding(.*)",
  "/portal(.*)",
  "/:locale/portal(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isWebhookApi = createRouteMatcher(["/api/webhooks(.*)"]);

const marketingRedirects = [
  "platform",
  "studio",
  "pricing",
  "case-studies",
  "why",
  "why-noirroutes",
  "why-NoirRoutes",
  "why-blackwayconnect",
  "request-quote",
  "faq",
  "support",
  "terms",
  "privacy",
  "products",
  "services",
];

/** Canonical why page is /why-noirroutes; rewrite legacy aliases. */
function rewriteWhyPath(pathname: string) {
  return pathname
    .replace(/\/why-blackwayconnect/gi, "/why-noirroutes")
    .replace(/\/why-NoirRoutes/g, "/why-noirroutes")
    .replace(/\/why\//g, "/why-noirroutes/")
    .replace(/\/why$/g, "/why-noirroutes");
}

function localeOnlyMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isApiRoute(req)) return NextResponse.next();

  for (const segment of marketingRedirects) {
    if (pathname === `/${segment}` || pathname.startsWith(`/${segment}/`)) {
      const url = req.nextUrl.clone();
      url.pathname = `/en${rewriteWhyPath(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  const rewritten = rewriteWhyPath(pathname);
  if (rewritten !== pathname) {
    const url = req.nextUrl.clone();
    url.pathname = rewritten;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = Boolean(
  clerkKey &&
    process.env.CLERK_SECRET_KEY &&
    !clerkKey.includes("placeholder") &&
    clerkKey.length > 20,
);

const isProdLike =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_ENV === "preview";

function redirectToSetup(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(en|fr)(\/|$)/);
  const locale = localeMatch?.[1] ?? "en";
  if (pathname.includes("/setup")) return localeOnlyMiddleware(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}/setup`;
  return NextResponse.redirect(url);
}

function failClosedWithoutClerk(req: NextRequest) {
  // Webhooks must remain reachable without Clerk session middleware
  if (isWebhookApi(req)) return NextResponse.next();
  if (isApiRoute(req)) return NextResponse.next();
  if (isProtectedRoute(req)) {
    return redirectToSetup(req);
  }
  return localeOnlyMiddleware(req);
}

function devWithoutClerk(req: NextRequest) {
  if (isWebhookApi(req)) return NextResponse.next();
  if (isApiRoute(req)) return NextResponse.next();
  // Soft-gate: send dashboard/admin/onboarding to setup instead of crashing auth
  if (isProtectedRoute(req)) {
    return redirectToSetup(req);
  }
  return localeOnlyMiddleware(req);
}

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (isApiRoute(req)) return NextResponse.next();
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
      return localeOnlyMiddleware(req);
    })
  : isProdLike
    ? failClosedWithoutClerk
    : devWithoutClerk;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
