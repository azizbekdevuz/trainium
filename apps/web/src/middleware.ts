import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "./lib/i18n-config";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const cookieName =
    process.env.NODE_ENV === "production" && !url.hostname.includes('localhost')
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  const token = await getToken({
    req,
    // Support either env var name; they must be the *same value*
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production" && !url.hostname.includes('localhost'),
    cookieName, // <-- key line for v5 cookies
  });

  // Locale handling: redirect to default locale if missing; if present, rewrite to non-locale path
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isSupported = first && (SUPPORTED_LOCALES as readonly string[]).includes(first);
  const isInternal = url.pathname.startsWith('/_next') || url.pathname.startsWith('/favicon') || url.pathname.startsWith('/public') || url.pathname.startsWith('/uploads') || url.pathname.startsWith('/assets') || url.pathname.startsWith('/images');
  const isAPI = url.pathname.startsWith('/api');

  let normalizedPathname = url.pathname;
  let res: NextResponse | null = null;
  if (!isInternal && !isAPI) {
    if (!isSupported) {
      // Try cookie first
      const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
      const preferred = (cookie && (SUPPORTED_LOCALES as readonly string[]).includes(cookie)) ? cookie : DEFAULT_LOCALE;
      const nextPath = ['/', preferred, ...segments].join('/').replace(/\/+/g, '/');
      url.pathname = nextPath;
      return NextResponse.redirect(url);
    } else {
      // Rewrite locale-prefixed path to the underlying non-locale route
      const effectiveSegments = segments.slice(1);
      const effectivePath = '/' + effectiveSegments.join('/');
      normalizedPathname = effectivePath || '/';
      const rewriteURL = req.nextUrl.clone();
      rewriteURL.pathname = normalizedPathname;
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-locale', first as string);
      res = NextResponse.rewrite(rewriteURL, {
        request: { headers: requestHeaders },
      });
    }
  }
  if (!res) {
    const requestHeaders = new Headers(req.headers);
    if (isSupported) requestHeaders.set('x-locale', first as string);
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  const pathForAuth = normalizedPathname;
  if (pathForAuth.startsWith('/admin')) {
    // Allow unauthenticated access to admin auth pages
    const isAdminAuth = pathForAuth.startsWith('/admin/auth');
    if (!isAdminAuth) {
      const role = (token as any)?.role;
      if (!token || role !== "ADMIN") {
        const redirectURL = req.nextUrl.clone();
        redirectURL.pathname = "/";
        return NextResponse.redirect(redirectURL);
      }
    }
  }

  if (pathForAuth === "/account" && !token) {
    const redirectURL = req.nextUrl.clone();
    redirectURL.pathname = "/auth/signin";
    return NextResponse.redirect(redirectURL);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|uploads|assets|images).*)",
    "/account",
    "/admin/:path*",
  ],
};