import Link from 'next/link';

type NavSegment =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'notifications'
  | 'analytics'
  | 'analyticsSeo'
  | 'faq';

interface AdminNavProps {
  lang: string;
  dict: Record<string, any>;
  activeSegment: NavSegment;
}

const baseLinkClass =
  'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105';
const inactiveClass =
  'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700';
const activeClass = 'bg-cyan-600 text-white';

export function AdminNav({ lang, dict, activeSegment }: AdminNavProps) {
  const link = (segment: NavSegment, href: string, labelKey: string) => {
    const isActive = activeSegment === segment;
    return (
      <Link
        href={href}
        className={`${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
      >
        {dict.admin?.nav?.[labelKey] ?? labelKey}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {link('dashboard', `/${lang}/admin`, 'dashboard')}
      {link('orders', `/${lang}/admin/orders`, 'orders')}
      {link('products', `/${lang}/admin/products`, 'products')}
      {link('customers', `/${lang}/admin/customers`, 'customers')}
      {link('notifications', `/${lang}/admin/notifications`, 'notifications')}
      {link('analytics', `/${lang}/admin/analytics`, 'analytics')}
      {link('analyticsSeo', `/${lang}/admin/analytics-seo`, 'analyticsSeo')}
      {link('faq', `/${lang}/admin/faq`, 'faq')}
    </div>
  );
}
