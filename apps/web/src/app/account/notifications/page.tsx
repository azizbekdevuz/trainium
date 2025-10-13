import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserNotificationsPaginated, getUnreadNotificationCount } from '../../../lib/notifications';
import { NotificationClient } from '../../../components/account/NotificationClient';
import { negotiateLocale } from '../../../lib/i18n';
import { getDictionary } from '../../../lib/i18n';
import { parsePaginationOptions, validatePaginationOptions } from '../../../lib/pagination-utils';

export const runtime = 'nodejs';

type SearchParams = {
  page?: string;
  limit?: string;
  filter?: string;
};

type Props = {
  searchParams?: Promise<SearchParams>;
};

export default async function NotificationsPage({ searchParams }: Props) {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/signin?callbackUrl=/${lang}/account/notifications`);
  }

  // Parse and validate pagination options
  const rawSearchParams = (await searchParams) ?? {};
  const paginationOptions = validatePaginationOptions(
    parsePaginationOptions(rawSearchParams)
  );

  const [paginationResult, unreadCount] = await Promise.all([
    getUserNotificationsPaginated(session.user.id, {
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      type: rawSearchParams.filter as any, // Filter by notification type
    }),
    getUnreadNotificationCount(session.user.id),
  ]);

  const parsedNotifications = paginationResult.items.map(notification => ({
    ...notification,
    data: notification.data ? JSON.parse(notification.data as string) : null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{dict.notifications?.pageTitle ?? dict.account?.notifications ?? 'Notifications'}</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${lang}/account`}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {dict.notifications?.backToAccount ?? dict.nav?.account ?? 'Back to Account'}
          </Link>
        </div>
      </div>

      <NotificationClient 
        initialNotifications={parsedNotifications}
        initialUnreadCount={unreadCount}
        pagination={{
          currentPage: paginationResult.currentPage,
          totalPages: paginationResult.totalPages,
          totalCount: paginationResult.totalCount,
          hasNext: paginationResult.hasNext,
          hasPrev: paginationResult.hasPrev,
        }}
        baseUrl={`/${lang}/account/notifications`}
        searchParams={rawSearchParams}
      />
    </div>
  );
}
