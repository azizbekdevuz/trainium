import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '../../../components/admin/AdminNav';
import { NotificationClient } from '../../../components/admin/NotificationClient';
import { negotiateLocale, getDictionary } from '../../../lib/i18n/i18n';

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
          <AdminNav lang={lang} dict={dict} activeSegment="notifications" />
        </div>

        <NotificationClient />
      </div>
    </div>
  );
}
