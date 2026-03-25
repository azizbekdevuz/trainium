"use client";

import { useState } from "react";
import Link from "next/link";
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

interface ResponsiveNavigationProps {
  lang: "en" | "ko" | "uz";
  dict: Record<string, unknown>;
}

export function ResponsiveNavigation({ lang, dict }: ResponsiveNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const linkBaseAdmin =
    "btn-primary relative inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium";

  const isAdminUser = isAdmin((session?.user as { role?: string })?.role);

  const brandName = (dict as { brand?: { name?: string } }).brand?.name ?? "Trainium";

  return (
    <>
      <nav className="mobile-nav mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="glass-surface rounded-2xl p-2 transition-all duration-200 hover:brightness-105 sm:p-3"
            aria-label="Open menu"
          >
            <Icon name="menu" className="h-5 w-5 text-[var(--text-secondary)] sm:h-6 sm:w-6" />
          </button>
          <Link
            href={`/${lang}`}
            className="font-display text-base font-extrabold tracking-[-0.04em] text-ui-primary sm:text-lg"
          >
            {brandName}
            <span className="text-brand-dot">.</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
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
              <AuthLinks />
            </>
          )}
        </div>
      </nav>

      <nav className="desktop-nav mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href={`/${lang}`}
          className="font-display text-[18px] font-extrabold tracking-[-0.04em] text-ui-primary"
        >
          {brandName}
          <span className="text-brand-dot">.</span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
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
              <Icon name="shieldUser" className="ml-1.5 inline w-5 h-5" />
            </Link>
          ) : null}

          <ThemeToggle />
          <MiniCart />
          <NotificationBell />
          <AuthLinks />
          <LanguageSwitcher locale={lang} />
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
