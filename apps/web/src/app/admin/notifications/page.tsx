import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
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
    <div className="bg-ui-inset dark:bg-ui-base">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ui-primary sm:text-3xl">
            {dict.admin?.notifications?.title ?? 'Notification Management'}
          </h1>
          <p className="mt-1 text-sm text-ui-muted dark:text-ui-faint sm:text-base">
            {dict.admin?.notifications?.subtitle ?? 'Send system-wide notifications to all users'}
          </p>
        </div>

        <NotificationClient />
      </div>
    </div>
  );
}
