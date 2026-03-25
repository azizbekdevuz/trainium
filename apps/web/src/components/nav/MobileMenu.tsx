'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useSession, signOut } from 'next-auth/react';
import { Icon } from '../ui/media/Icon';
import { useI18n } from '../providers/I18nProvider';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AuthLinks from './AuthLinks';
import { isAdmin } from '@/auth/rbac';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { dict, lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  const navItems = [
    { href: `/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`, label: dict.nav.shop },
    { href: `/${lang}/special-bargain`, label: dict.nav.deals },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/contact`, label: dict.nav.support },
  ];

  const isAdminUser = isAdmin((session?.user as { role?: string })?.role);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="modal-backdrop fixed inset-0 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div
        className="mobile-menu-container modal-surface fixed inset-x-0 bottom-0 top-[8vh] z-[90] flex max-h-[92dvh] flex-col rounded-t-[28px] sm:inset-x-3 sm:top-[10vh] sm:max-h-[90dvh] sm:rounded-t-[32px]"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--border-strong)] opacity-60"
          aria-hidden
        />
        {/* Header with Close Button */}
        <div
          className="flex shrink-0 flex-row items-center justify-between border-b border-[var(--border-subtle)] p-4 sm:p-6"
        >
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em] text-ui-primary sm:text-xl">
            {dict.brand.name}
            <span className="text-brand-dot">.</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border-default)] p-2 transition-all duration-200 hover:bg-[var(--bg-inset)] active:scale-95 sm:p-3"
            aria-label="Close menu"
          >
            <Icon name="cancel" className="h-5 w-5 text-[var(--text-secondary)] sm:h-6 sm:w-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto mobile-menu-scrollable">
          {session?.user ? (
            // Clean authenticated mobile menu
            <>
              {/* User Profile Section */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-ui-default dark:border-ui-subtle">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="user" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ui-primary text-sm sm:text-base truncate">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="text-xs sm:text-sm text-ui-muted dark:text-ui-faint truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 sm:p-6 space-y-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className="block py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-semibold text-ui-primary hover:bg-ui-inset dark:hover:bg-ui-elevated rounded-2xl transition-all duration-200 hover:shadow-md border border-transparent hover:border-ui-default dark:hover:border-ui-subtle"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdminUser && (
                  <Link
                    href={`/${lang}/admin`}
                    className="block py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-semibold bg-cyan-600 text-white rounded-lg hover:opacity-90 transition-all duration-200"
                    onClick={onClose}
                  >
                    {dict.nav?.admin ?? 'Admin'} <Icon name="shieldUser" className="w-5 h-5 inline ml-1.5" />
                  </Link>
                )}
              </nav>

              {/* Account Actions */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <div className="space-y-2">
                  <Link 
                    href={`/${lang}/account`}
                    className="block w-full text-center py-2 sm:py-3 px-4 glass-surface text-ui-primary rounded-xl hover:bg-ui-inset dark:hover:bg-ui-inset transition-colors border border-ui-default dark:border-ui-subtle font-medium text-sm sm:text-base"
                    onClick={onClose}
                  >
                    {dict.nav?.myAccount || 'My Account'}
                  </Link>
                  <button 
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="block w-full text-center py-2 sm:py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    {dict.nav?.signOut || 'Sign Out'}
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="p-4 sm:p-6 border-t border-ui-default dark:border-ui-subtle glass space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 glass-surface rounded-xl border border-ui-default dark:border-ui-subtle">
                  <span className="text-base sm:text-lg font-semibold text-ui-secondary">{dict.nav?.theme || 'Theme'}</span>
                  <div className="scale-110 sm:scale-125">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 glass-surface rounded-xl border border-ui-default dark:border-ui-subtle">
                  <span className="text-base sm:text-lg font-semibold text-ui-secondary">{dict.nav?.language || 'Language'}</span>
                  <div className="scale-110 sm:scale-125">
                    <LanguageSwitcher locale={lang as 'en' | 'ko' | 'uz'} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Non-authenticated mobile menu (keep existing design)
            <>
              {/* Navigation Links */}
              <nav className="p-4 sm:p-6 space-y-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className="block py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-semibold text-ui-primary hover:bg-ui-inset dark:hover:bg-ui-elevated rounded-2xl transition-all duration-200 hover:shadow-md border border-transparent hover:border-ui-default dark:hover:border-ui-subtle"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              
              {/* Priority Auth Section */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-cyan-200 dark:border-ui-subtle">
                  <AuthLinks />
                </div>
              </div>
              
              {/* Footer Settings */}
              <div className="p-4 sm:p-6 border-t border-ui-default dark:border-ui-subtle glass space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle">
                  <span className="text-base sm:text-lg font-semibold text-ui-secondary">
                    {dict.nav?.theme || 'Theme'}
                  </span>
                  <div className="scale-110 sm:scale-125">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle">
                  <span className="text-base sm:text-lg font-semibold text-ui-secondary">
                    {dict.nav?.language || 'Language'}
                  </span>
                  <div className="scale-110 sm:scale-125">
                    <LanguageSwitcher locale={lang as 'en' | 'ko' | 'uz'} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}