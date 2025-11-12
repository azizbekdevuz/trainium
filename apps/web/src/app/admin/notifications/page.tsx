import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { NotificationClient } from '../../../components/admin/NotificationClient';
import { negotiateLocale, getDictionary } from '../../../lib/i18n/i18n';
import Link from 'next/link';

export const runtime = 'nodejs';

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin?callbackUrl=/admin/notifications');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{dict.admin?.notifications?.title ?? 'Notification Management'}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">{dict.admin?.notifications?.subtitle ?? 'Send system-wide notifications to all users'}</p>
          </div>

          {/* Admin Navigation */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href={`/${lang}/admin/orders`}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              {dict.admin?.nav?.orders ?? 'Orders'}
            </Link>
            <Link
              href={`/${lang}/admin/products`}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              {dict.admin?.nav?.products ?? 'Products'}
            </Link>
            <Link
              href={`/${lang}/admin/customers`}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              {dict.admin?.nav?.customers ?? 'Customers'}
            </Link>
            <Link
              href={`/${lang}/admin/notifications`}
              className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-medium"
            >
              {dict.admin?.nav?.notifications ?? 'Notifications'}
            </Link>
            <Link
              href={`/${lang}/admin/analytics`}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              {dict.admin?.nav?.analytics ?? 'Analytics'}
            </Link>
            <Link
              href={`/${lang}/admin/faq`}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              {dict.admin?.nav?.faq ?? 'FAQ'}
            </Link>
          </div>
        </div>

        <NotificationClient />
      </div>
    </div>
  );
}
