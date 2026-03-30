"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MobileMenu } from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import MiniCart from "./MiniCart";
import { NotificationBell } from "./NotificationBell";
import AuthLinks from "./AuthLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import { Icon } from "../ui/media/Icon";
import { isAdmin } from "@/auth/rbac";
import { cn } from "@/lib/utils/format";
import { NavProductSearch } from "./NavProductSearch";

interface ResponsiveNavigationProps {
  lang: "en" | "ko" | "uz";
  dict: Record<string, unknown>;
}

export function ResponsiveNavigation({ lang, dict }: ResponsiveNavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { data: session } = useSession();

  const linkBaseAdmin =
    "btn-primary relative inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium";

  const isAdminUser = isAdmin((session?.user as { role?: string })?.role);

  const brandName = (dict as { brand?: { name?: string } }).brand?.name ?? "Trainium";

  const products = (dict as { pages?: { products?: { searchPh?: string; searchAria?: string } } }).pages?.products;
  const searchPlaceholder = products?.searchPh ?? "Search products";
  const searchAria = products?.searchAria ?? "Search products";

  const navLabels = (dict as { nav?: Record<string, string> }).nav ?? {};

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  const desktopLinks = (
    <>
      <Link
        href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`}
        className={cn(
          "nav-link-desktop relative px-1 py-1 text-[13px] font-medium transition-colors duration-150",
          "after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:rounded-full after:bg-[var(--accent)] after:transition-all after:duration-200 hover:after:w-full",
        )}
      >
        {(dict as { nav?: { shop?: string } }).nav?.shop}
      </Link>
      <Link
        href={`/${lang}/special-bargain`}
        className={cn(
          "nav-link-desktop relative px-1 py-1 text-[13px] font-medium transition-colors duration-150",
          "after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:rounded-full after:bg-[var(--accent)] after:transition-all after:duration-200 hover:after:w-full",
        )}
      >
        {(dict as { nav?: { deals?: string } }).nav?.deals}
      </Link>
      <Link
        href={`/${lang}/about`}
        className={cn(
          "nav-link-desktop relative px-1 py-1 text-[13px] font-medium transition-colors duration-150",
          "after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:rounded-full after:bg-[var(--accent)] after:transition-all after:duration-200 hover:after:w-full",
        )}
      >
        {(dict as { nav?: { about?: string } }).nav?.about}
      </Link>
      <Link
        href={`/${lang}/contact`}
        className={cn(
          "nav-link-desktop relative px-1 py-1 text-[13px] font-medium transition-colors duration-150",
          "after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:rounded-full after:bg-[var(--accent)] after:transition-all after:duration-200 hover:after:w-full",
        )}
      >
        {(dict as { nav?: { support?: string } }).nav?.support}
      </Link>
      {isAdminUser ? (
        <Link href={`/${lang}/admin`} className={linkBaseAdmin}>
          {(dict as { nav?: { admin?: string } }).nav?.admin ?? "Admin"}{" "}
          <Icon name="shieldUser" className="ml-1.5 inline h-5 w-5" />
        </Link>
      ) : null}
    </>
  );

  return (
    <>
      <nav className="mobile-nav mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="glass-surface shrink-0 rounded-2xl p-2.5 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            aria-label={navLabels.openMenu ?? "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <Icon name="menu" className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
          <Link
            href={`/${lang}`}
            className="min-w-0 truncate font-display text-base font-extrabold tracking-[-0.04em] text-ui-primary sm:text-[17px]"
          >
            {brandName}
            <span className="text-brand-dot">.</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((o) => !o)}
            className={cn(
              "rounded-2xl p-2.5 transition-all duration-200 active:scale-[0.98]",
              mobileSearchOpen
                ? "bg-cyan-500/15 text-cyan-600 ring-2 ring-cyan-500/30 dark:text-cyan-300"
                : "glass-surface text-[var(--text-secondary)] hover:brightness-105",
            )}
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-nav-product-search"
            aria-label={
              mobileSearchOpen
                ? (navLabels.collapseSearch ?? "Hide search")
                : (navLabels.expandSearch ?? "Search shop")
            }
          >
            <Icon name={mobileSearchOpen ? "cancel" : "search"} className="h-5 w-5" />
          </button>
          {session?.user ? (
            <>
              <MiniCart />
              <NotificationBell />
            </>
          ) : (
            <>
              <ThemeToggle />
              <MiniCart />
              <NotificationBell />
              <AuthLinks compact />
            </>
          )}
        </div>
      </nav>

      {mobileSearchOpen ? (
        <div
          id="mobile-nav-search-panel"
          className="border-t border-ui-subtle/60 bg-ui-elevated/95 backdrop-blur-md md:hidden"
        >
          <Suspense
            fallback={<div className="mx-3 mb-2 h-11 animate-pulse rounded-xl bg-ui-inset" aria-hidden />}
          >
            <NavProductSearch
              id="mobile-nav-product-search"
              lang={lang}
              placeholder={searchPlaceholder}
              ariaLabel={searchAria}
              variant="mobile"
              compact
            />
          </Suspense>
        </div>
      ) : null}

      <nav className="desktop-nav mx-auto hidden max-w-7xl items-center gap-4 px-6 py-3 md:flex">
        <Link
          href={`/${lang}`}
          className="shrink-0 font-display text-[18px] font-extrabold tracking-[-0.04em] text-ui-primary"
        >
          {brandName}
          <span className="text-brand-dot">.</span>
        </Link>

        <div className="hidden shrink-0 items-center gap-6 text-sm lg:flex">{desktopLinks}</div>

        <Suspense
          fallback={
            <div
              className="mx-4 hidden h-9 max-w-md flex-1 animate-pulse rounded-xl bg-ui-inset md:block"
              aria-hidden
            />
          }
        >
          <NavProductSearch
            lang={lang}
            placeholder={searchPlaceholder}
            ariaLabel={searchAria}
            variant="desktop"
          />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-2 lg:hidden">{desktopLinks}</div>
          {session?.user ? (
            <>
              <AuthLinks />
              <ThemeToggle />
              <MiniCart />
              <NotificationBell />
            </>
          ) : (
            <>
              <ThemeToggle />
              <MiniCart />
              <NotificationBell />
            </>
          )}
          <LanguageSwitcher locale={lang} />
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
