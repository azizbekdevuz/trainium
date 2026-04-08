import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "./lib/i18n/i18n-config";

const REQUEST_ID_HEADER = "x-request-id";

function getOrCreateRequestId(req: NextRequest): string {
  const incoming = req.headers.get(REQUEST_ID_HEADER)?.trim();
  if (incoming && /^[a-zA-Z0-9_-]{8,128}$/.test(incoming)) {
    return incoming;
  }
  return crypto.randomUUID();
}

function attachRequestIdHeaders(
  req: NextRequest,
  requestId: string,
  base?: Headers
): Headers {
  const h = base ?? new Headers(req.headers);
  h.set(REQUEST_ID_HEADER, requestId);
  return h;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const requestId = getOrCreateRequestId(req);

  // --------------------------
  // 1. Locale handling
  // --------------------------

  // break the path into segments
  const segments = url.pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Is the first segment a supported locale like "en", "ko", "uz"?
  const isSupported =
    first && (SUPPORTED_LOCALES as readonly string[]).includes(first);

  // If it's /en/api/... we don't want to rewrite or redirect locale logic
  if (isSupported && segments[1] === "api") {
    const res = NextResponse.next({
      request: { headers: attachRequestIdHeaders(req, requestId) },
    });
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  // treat these as internal/static so we don't mess with them
  const isInternal =
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/public") ||
    url.pathname.startsWith("/uploads") ||
    url.pathname.startsWith("/assets") ||
    url.pathname.startsWith("/images");

  const isAPI = url.pathname.startsWith("/api");

  // We'll potentially rewrite the URL without the locale prefix
  let normalizedPathname = url.pathname;
  let res: NextResponse | null = null;

  // If it's not internal and not API,
  // we either:
  // - inject locale (redirect /something -> /en/something)
  // - or rewrite to strip the locale for routing
  if (!isInternal && !isAPI) {
    if (!isSupported) {
      // No locale prefix in the URL -> redirect to best locale
      const cookie = req.cookies.get(LOCALE_COOKIE)?.value;

      const preferred =
        cookie && (SUPPORTED_LOCALES as readonly string[]).includes(cookie)
          ? cookie
          : DEFAULT_LOCALE;

      const nextPath = ["/", preferred, ...segments]
        .join("/")
        .replace(/\/+/g, "/");

      url.pathname = nextPath;
      const redirectRes = NextResponse.redirect(url);
      redirectRes.headers.set(REQUEST_ID_HEADER, requestId);
      return redirectRes;
    } else {
      // Locale IS present. We rewrite so the actual page loader sees path WITHOUT the locale prefix.
      // Example: /en/account -> internally treat it as /account
      const effectiveSegments = segments.slice(1); // drop locale
      const effectivePath = "/" + effectiveSegments.join("/");
      normalizedPathname = effectivePath || "/";

      const rewriteURL = req.nextUrl.clone();
      rewriteURL.pathname = normalizedPathname;

      const requestHeaders = attachRequestIdHeaders(req, requestId);
      requestHeaders.set("x-locale", first as string);

      res = NextResponse.rewrite(rewriteURL, {
        request: { headers: requestHeaders },
      });
      // Keep cookie aligned with URL so client-only reads and server agree after direct navigation
      res.cookies.set(LOCALE_COOKIE, first as string, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30 * 6, // ~6 months, matches LanguageSwitcher
        sameSite: "lax",
      });
    }
  }

  // If we didn't redirect or rewrite yet, just continue the request,
  // but still inject x-locale header if locale is in URL.
  if (!res) {
    const requestHeaders = attachRequestIdHeaders(req, requestId);
    if (isSupported) requestHeaders.set("x-locale", first as string);

    res = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  res.headers.set(REQUEST_ID_HEADER, requestId);
  return res;
}

// Keep the same matcher list so middleware still runs for locale + rewrites.
// Include /api so API routes get x-request-id for structured logs.
export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|uploads|assets|images).*)",
    "/account",
    "/admin/:path*",
  ],
};
