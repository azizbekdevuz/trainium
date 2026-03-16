import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import { AdminNav } from '@/components/admin/AdminNav';
import { FaqManagementClient } from '@/components/admin/FaqManagementClient';

export default async function AdminFaqPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {dict.faq?.admin?.title || 'FAQ Management'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
                {dict.faq?.manageCategoriesAndQuestions || 'Manage FAQ categories and questions with multi-language support'}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{dict.common?.adminPanel || 'Admin Panel'}</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-4 sm:mb-6">
          <AdminNav lang={lang} dict={dict} activeSegment="faq" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          <FaqManagementClient />
        </div>
      </div>
    </div>
  );
}
