import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import Link from 'next/link';
import { UserIcon, GlobeIcon, Smartphone, FileIcon, CheckCheck, Globe } from "lucide-react";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default async function AdminAnalyticsSeoPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {dict.admin?.analyticsSeo?.title ?? 'Visitor Analytics'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              {dict.admin?.analyticsSeo?.subtitle ?? 'Traffic, pages, devices, referrers and more.'}
            </p>
          </div>
        </div>

        {/* Vercel Analytics Info Card */}
        <div className="mt-6 rounded-2xl border bg-white dark:bg-slate-900 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {dict.admin?.analyticsSeo?.vercelAnalytics?.title ?? 'Vercel Analytics'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {dict.admin?.analyticsSeo?.vercelAnalytics?.subtitle ?? 'Your site is using Vercel Analytics for tracking visitor data. Analytics are automatically collected and can be viewed in your Vercel Dashboard.'}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="https://vercel.com/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:opacity-90 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 19.5h20L12 2z" />
                  </svg>
                  {dict.admin?.analyticsSeo?.vercelAnalytics?.openVercelDashboard ?? 'Open Vercel Dashboard'}
                </Link>
                <Link
                  href="https://vercel.com/docs/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {dict.admin?.analyticsSeo?.vercelAnalytics?.viewDocumentation ?? 'View Documentation'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<UserIcon />}
            title={dict.admin?.analyticsSeo?.features?.visitors?.title ?? 'Visitors'}
            description={dict.admin?.analyticsSeo?.features?.visitors?.description ?? 'Track unique visitors and page views across your site'}
          />
          <FeatureCard
            icon={<GlobeIcon />}
            title={dict.admin?.analyticsSeo?.features?.geography?.title ?? 'Geography'}
            description={dict.admin?.analyticsSeo?.features?.geography?.description ?? 'See where your visitors are coming from around the world'}
          />
          <FeatureCard
            icon={<Smartphone />}
            title={dict.admin?.analyticsSeo?.features?.devices?.title ?? 'Devices'}
            description={dict.admin?.analyticsSeo?.features?.devices?.description ?? 'Understand which devices your audience uses'}
          />
          <FeatureCard
            icon={<Globe />}
            title={dict.admin?.analyticsSeo?.features?.referrers?.title ?? 'Referrers'}
            description={dict.admin?.analyticsSeo?.features?.referrers?.description ?? 'Discover how visitors find your site'}
          />
          <FeatureCard
            icon={<FileIcon />}
            title={dict.admin?.analyticsSeo?.features?.topPages?.title ?? 'Top Pages'}
            description={dict.admin?.analyticsSeo?.features?.topPages?.description ?? 'See which pages get the most traffic'}
          />
        </div>

        {/* Setup Info */}
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            <CheckCheck /> {dict.admin?.analyticsSeo?.setupInfo?.title ?? 'Analytics Active'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {dict.admin?.analyticsSeo?.setupInfo?.description ?? 'Vercel Analytics is automatically tracking page views and visitor data on trainium.shop. No additional configuration is needed. Visit the Vercel Dashboard to view your analytics data.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </div>
  );
}
