'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useSession, signOut } from 'next-auth/react';
import { Icon } from '../ui/Icon';
import { useI18n } from '../providers/I18nProvider';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AuthLinks from './AuthLinks';
import InteractiveBackground from '../background/InteractiveBackground';

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
      {/* Interactive Background */}
      <InteractiveBackground />
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Mobile Menu Content */}
      <div className="fixed inset-0 z-10 flex flex-col bg-white dark:bg-slate-900 mobile-menu-container">
        {/* Header with Close Button */}
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 glass flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict.brand.name}<span className="text-cyan-600">.</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-600"
            aria-label="Close menu"
          >
            <Icon name="cancel" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto mobile-menu-scrollable">
          {session?.user ? (
            // Clean authenticated mobile menu
            <>
              {/* User Profile Section */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="user" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
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
                    className="block py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200 hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Account Actions */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <div className="space-y-2">
                  <Link 
                    href={`/${lang}/account`}
                    className="block w-full text-center py-2 sm:py-3 px-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600 font-medium text-sm sm:text-base"
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
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 glass space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                  <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">{dict.nav?.theme || 'Theme'}</span>
                  <div className="scale-110 sm:scale-125">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                  <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">{dict.nav?.language || 'Language'}</span>
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
                    className="block py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200 hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              
              {/* Priority Auth Section */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-cyan-200 dark:border-slate-600">
                  <AuthLinks />
                </div>
              </div>
              
              {/* Footer Settings */}
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 glass space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600">
                  <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {dict.nav?.theme || 'Theme'}
                  </span>
                  <div className="scale-110 sm:scale-125">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600">
                  <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
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