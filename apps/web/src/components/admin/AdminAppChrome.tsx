'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Bell,
  BarChart3,
  LineChart,
  HelpCircle,
  Menu,
  ChevronsLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils/format';
import type { Dictionary } from '@/lib/i18n/i18n';

type AdminUser = { name: string | null; email: string | null };

const SEGMENTS = [
  { segment: 'dashboard' as const, href: '', labelKey: 'dashboard', Icon: LayoutDashboard },
  { segment: 'orders' as const, href: '/orders', labelKey: 'orders', Icon: ShoppingBag },
  { segment: 'products' as const, href: '/products', labelKey: 'products', Icon: Package },
  { segment: 'customers' as const, href: '/customers', labelKey: 'customers', Icon: Users },
  { segment: 'notifications' as const, href: '/notifications', labelKey: 'notifications', Icon: Bell },
  { segment: 'analytics' as const, href: '/analytics', labelKey: 'analytics', Icon: BarChart3 },
  { segment: 'analyticsSeo' as const, href: '/analytics-seo', labelKey: 'analyticsSeo', Icon: LineChart },
  { segment: 'faq' as const, href: '/faq', labelKey: 'faq', Icon: HelpCircle },
];

function activeSegmentForPath(pathname: string | null): (typeof SEGMENTS)[number]['segment'] {
  if (!pathname) return 'dashboard';
  const base = pathname.replace(/^\/(en|ko|uz)\/admin/, '') || '/';
  if (base === '/' || base === '') return 'dashboard';
  if (base.startsWith('/orders')) return 'orders';
  if (base.startsWith('/products')) return 'products';
  if (base.startsWith('/customers')) return 'customers';
  if (base.startsWith('/notifications')) return 'notifications';
  if (base.startsWith('/analytics-seo')) return 'analyticsSeo';
  if (base.startsWith('/analytics')) return 'analytics';
  if (base.startsWith('/faq')) return 'faq';
  return 'dashboard';
}

export function AdminAppChrome({
  children,
  lang,
  dict,
  user,
}: {
  children: React.ReactNode;
  lang: string;
  dict: Dictionary;
  user: AdminUser;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname?.includes('/admin/auth')) {
    return <>{children}</>;
  }

  const active = activeSegmentForPath(pathname);
  const nav = dict.admin?.nav;
  const initials =
    (user.name?.trim()?.charAt(0) || user.email?.trim()?.charAt(0) || 'A').toUpperCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ui-inset dark:bg-ui-base">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-0 lg:flex-row lg:gap-5 lg:px-4 lg:py-6">
        <aside
          className={cn(
            'hidden flex-col border-ui-subtle glass-surface shadow-lg transition-[width] duration-200 ease-out lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:rounded-2xl lg:border lg:flex',
            collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[min(280px,26vw)] lg:min-w-[220px]',
          )}
          aria-label="Admin navigation"
        >
          <div
            className={cn(
              'flex items-center justify-between gap-2 border-b border-ui-subtle p-3',
              collapsed && 'lg:flex-col lg:py-4',
            )}
          >
            {!collapsed ? (
              <p className="truncate px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ui-faint">
                {dict.common?.adminPanel ?? 'Admin panel'}
              </p>
            ) : (
              <span className="sr-only">{dict.common?.adminPanel ?? 'Admin panel'}</span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ui-subtle bg-ui-elevated text-ui-primary hover:bg-ui-inset"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
            {SEGMENTS.map(({ segment, href, labelKey, Icon: Ic }) => {
              const isActive = active === segment;
              const fullHref = `/${lang}/admin${href}`;
              return (
                <Link
                  key={segment}
                  href={fullHref}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'border border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'text-ui-secondary hover:bg-ui-inset hover:text-ui-primary',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                >
                  <Ic className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                  {!collapsed ? <span>{(nav as Record<string, string>)?.[labelKey] ?? labelKey}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-ui-subtle p-3">
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl border border-ui-subtle bg-ui-elevated/80 p-2.5',
                collapsed && 'lg:flex-col lg:justify-center',
              )}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-sm font-bold text-white"
                aria-hidden
              >
                {initials}
              </div>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ui-primary">{user.name ?? 'Admin'}</p>
                  <p className="truncate text-xs text-ui-faint">{user.email ?? '—'}</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-0 lg:py-0">
          <nav
            className="-mx-1 mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Admin navigation"
          >
            {SEGMENTS.map(({ segment, href, labelKey, Icon: Ic }) => {
              const isActive = active === segment;
              return (
                <Link
                  key={segment}
                  href={`/${lang}/admin${href}`}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold',
                    isActive
                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200'
                      : 'border-ui-subtle bg-ui-elevated text-ui-secondary',
                  )}
                >
                  <Ic className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  {(nav as Record<string, string>)?.[labelKey] ?? labelKey}
                </Link>
              );
            })}
          </nav>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-ui-subtle glass-surface p-3 lg:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ui-primary">{user.name ?? 'Admin'}</p>
              <p className="truncate text-xs text-ui-faint">{user.email ?? '—'}</p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
