import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import { FaqManagementClient } from '@/components/admin/FaqManagementClient';

export default async function AdminFaqPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="bg-ui-inset dark:bg-ui-base">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ui-primary">
                {dict.faq?.admin?.title || 'FAQ Management'}
              </h1>
              <p className="text-ui-muted dark:text-ui-faint mt-1 text-sm sm:text-base">
                {dict.faq?.manageCategoriesAndQuestions || 'Manage FAQ categories and questions with multi-language support'}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-ui-faint dark:text-ui-faint">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{dict.common?.adminPanel || 'Admin Panel'}</span>
            </div>
          </div>
        </div>

        <div className="glass-surface rounded-xl shadow-sm border border-ui-default dark:border-ui-subtle p-4 sm:p-6">
          <FaqManagementClient />
        </div>
      </div>
    </div>
  );
}
