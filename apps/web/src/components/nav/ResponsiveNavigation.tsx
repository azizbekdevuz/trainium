'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
// import { useResponsiveFallback } from '../../hooks/useResponsiveFallback';
import { MobileMenu } from './MobileMenu';
import ThemeToggle from './ThemeToggle';
import MiniCart from './MiniCart';
import { NotificationBell } from './NotificationBell';
import AuthLinks from './AuthLinks';
import LanguageSwitcher from './LanguageSwitcher';
import { Icon } from '../ui/Icon';

interface ResponsiveNavigationProps {
  lang: 'en' | 'ko' | 'uz';
  dict: any;
}

export function ResponsiveNavigation({ lang, dict }: ResponsiveNavigationProps) {
  // const { isMobile } = useResponsiveFallback();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const linkBase = "relative hover:opacity-90 transition";
  const linkUnderline = "after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-cyan-600 after:transition-all hover:after:w-full";

  return (
    <>
      {/* Mobile Layout with CSS fallback */}
      <nav className="mobile-nav mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-300" />
            </button>
          <Link href={`/${lang}`} className="font-display text-base sm:text-lg font-semibold tracking-tight">
            {dict.brand.name}<span className="text-cyan-600">.</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {session?.user ? (
            // Clean authenticated mobile navbar - only essential icons
            <>
              <MiniCart />
              <NotificationBell />
            </>
          ) : (
            // Full navbar for non-authenticated users
            <>
              <ThemeToggle />
              <MiniCart />
              <NotificationBell />
              <AuthLinks />
            </>
          )}
        </div>
      </nav>

      {/* Desktop Layout with CSS fallback */}
      <nav className="desktop-nav mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={`/${lang}`} className="font-display text-xl font-semibold tracking-tight">
          {dict.brand.name}<span className="text-cyan-600">.</span>
        </Link>
        
        <div className="flex items-center gap-6 text-sm">
          <Link href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`} className={`${linkBase} ${linkUnderline}`}>
            {dict.nav.shop}
          </Link>
          <Link href={`/${lang}/special-bargain`} className={`${linkBase} ${linkUnderline}`}>
            {dict.nav.deals}
          </Link>
          <Link href={`/${lang}/about`} className={`${linkBase} ${linkUnderline}`}>
            {dict.nav.about}
          </Link>
          <Link href={`/${lang}/contact`} className={`${linkBase} ${linkUnderline}`}>
            {dict.nav.support}
          </Link>

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
