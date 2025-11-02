import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "./lib/i18n-config";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

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
    return NextResponse.next();
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
      return NextResponse.redirect(url);
    } else {
      // Locale IS present. We rewrite so the actual page loader sees path WITHOUT the locale prefix.
      // Example: /en/account -> internally treat it as /account
      const effectiveSegments = segments.slice(1); // drop locale
      const effectivePath = "/" + effectiveSegments.join("/");
      normalizedPathname = effectivePath || "/";

      const rewriteURL = req.nextUrl.clone();
      rewriteURL.pathname = normalizedPathname;

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-locale", first as string);

      res = NextResponse.rewrite(rewriteURL, {
        request: { headers: requestHeaders },
      });
    }
  }

  // If we didn't redirect or rewrite yet, just continue the request,
  // but still inject x-locale header if locale is in URL.
  if (!res) {
    const requestHeaders = new Headers(req.headers);
    if (isSupported) requestHeaders.set("x-locale", first as string);

    res = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // --------------------------
  // 2. IMPORTANT CHANGE:
  // We are NOT doing auth/role checks here anymore.
  //
  // Why?
  // - Your cookie detection in production was unreliable.
  // - It was always thinking "not logged in" and redirecting.
  // - /account and /admin are already protected in their layouts
  //   using `auth()` server-side, which is reliable.
  //
  // Account layout:
  //   if (!session?.user) redirect("/auth/signin")
  // Admin layout:
  //   if (!session?.user || role !== "ADMIN") redirect("/")
  //
  // So we just return `res` now.
  // --------------------------

  return res;
}

// Keep the same matcher list so middleware still runs for locale + rewrites.
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|uploads|assets|images).*)",
    "/account",
    "/admin/:path*",
  ],
};

