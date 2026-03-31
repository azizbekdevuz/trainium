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
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
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
    setUtilitiesOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (!utilitiesOpen && !mobileSearchOpen) return;
      setUtilitiesOpen(false);
      setMobileSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [utilitiesOpen, mobileSearchOpen]);

  function toggleUtilities() {
    setUtilitiesOpen((o) => {
      const next = !o;
      if (!next) setMobileSearchOpen(false);
      return next;
    });
  }

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
      <nav className="mobile-nav mx-auto box-border flex max-w-7xl min-w-0 flex-col gap-2 overflow-x-hidden px-3 py-2.5 sm:px-4 md:hidden">
        {/* Row 1: menu + brand stay clear; cart, bell, toolbar toggle never overflow into hamburger */}
        <div className="relative z-10 flex w-full min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="glass-surface relative z-20 shrink-0 rounded-2xl p-2.5 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              aria-label={navLabels.openMenu ?? "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <Icon name="menu" className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
            <Link
              href={`/${lang}`}
              className="min-w-0 flex-1 truncate font-display text-base font-extrabold tracking-[-0.04em] text-ui-primary sm:text-[17px]"
            >
              {brandName}
              <span className="text-brand-dot">.</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <MiniCart />
            <NotificationBell />
            <button
              type="button"
              onClick={toggleUtilities}
              className={cn(
                "shrink-0 rounded-2xl p-2.5 transition-all duration-200 active:scale-[0.98]",
                utilitiesOpen
                  ? "bg-cyan-500/15 text-cyan-600 ring-2 ring-cyan-500/30 dark:text-cyan-300"
                  : "glass-surface text-[var(--text-secondary)] hover:brightness-105",
              )}
              aria-expanded={utilitiesOpen}
              aria-controls="nav-utilities-mobile"
              aria-label={
                utilitiesOpen
                  ? (navLabels.closeToolbar ?? "Hide navigation tools")
                  : (navLabels.openToolbar ?? "Show search, theme, and account")
              }
            >
              <Icon name={utilitiesOpen ? "cancel" : "moreHorizontal"} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Row 2: full-width wrap — avoids single-row horizontal overflow and overlap with menu */}
        {utilitiesOpen ? (
          <div
            id="nav-utilities-mobile"
            className="flex w-full min-w-0 max-w-full flex-col gap-2 border-t border-ui-subtle/60 pt-2"
          >
            {mobileSearchOpen ? (
              <Suspense
                fallback={
                  <div className="h-11 w-full animate-pulse rounded-xl bg-ui-inset" aria-hidden />
                }
              >
                <NavProductSearch
                  id="mobile-nav-product-search"
                  lang={lang}
                  placeholder={searchPlaceholder}
                  ariaLabel={searchAria}
                  variant="mobile"
                  embeddedInNav
                />
              </Suspense>
            ) : null}
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((o) => !o)}
                className={cn(
                  "shrink-0 rounded-2xl p-2.5 transition-all duration-200 active:scale-[0.98]",
                  mobileSearchOpen
                    ? "bg-cyan-500/15 text-cyan-600 ring-2 ring-cyan-500/30 dark:text-cyan-300"
                    : "glass-surface text-[var(--text-secondary)] hover:brightness-105",
                )}
                aria-expanded={mobileSearchOpen}
                aria-controls={mobileSearchOpen ? "mobile-nav-product-search" : undefined}
                aria-label={
                  mobileSearchOpen
                    ? (navLabels.collapseSearch ?? "Hide search")
                    : (navLabels.expandSearch ?? "Search shop")
                }
              >
                <Icon name={mobileSearchOpen ? "cancel" : "search"} className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <div className="flex min-w-0 max-w-full flex-1 basis-full flex-wrap items-center gap-2 sm:basis-auto sm:flex-initial">
                <AuthLinks compact />
              </div>
            </div>
          </div>
        ) : null}
      </nav>

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

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-2 lg:hidden">{desktopLinks}</div>

          <MiniCart />
          <NotificationBell />

          {utilitiesOpen ? (
            <div
              id="nav-utilities-desktop-md"
              className="hidden items-center gap-2 md:flex lg:hidden"
            >
              <AuthLinks />
              <ThemeToggle />
              <LanguageSwitcher locale={lang} />
            </div>
          ) : null}

          <button
            type="button"
            onClick={toggleUtilities}
            className={cn(
              "hidden shrink-0 rounded-xl p-2.5 transition-all duration-200 active:scale-[0.98] md:inline-flex lg:hidden",
              utilitiesOpen
                ? "bg-cyan-500/15 text-cyan-600 ring-2 ring-cyan-500/30 dark:text-cyan-300"
                : "glass-surface text-[var(--text-secondary)] hover:brightness-105",
            )}
            aria-expanded={utilitiesOpen}
            aria-controls="nav-utilities-desktop-md"
            aria-label={
              utilitiesOpen
                ? (navLabels.closeToolbar ?? "Hide navigation tools")
                : (navLabels.openToolbar ?? "Show search, theme, and account")
            }
          >
            <Icon name={utilitiesOpen ? "cancel" : "moreHorizontal"} className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-4 lg:flex">
            <AuthLinks />
            <ThemeToggle />
            <LanguageSwitcher locale={lang} />
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
