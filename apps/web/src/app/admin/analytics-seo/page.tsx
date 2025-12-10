import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import Link from 'next/link';
import { UserIcon, GlobeIcon, Smartphone, FileIcon, BarChart3, Globe } from "lucide-react";

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

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

        {/* Google Analytics Info Card */}
        <div className="mt-6 rounded-2xl border bg-white dark:bg-slate-900 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Google Analytics
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {gaId 
                  ? `Your site is using Google Analytics (${gaId.substring(0, 8)}...). View detailed analytics in your Google Analytics Dashboard.`
                  : 'Google Analytics is not configured. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to your environment variables.'}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:opacity-90 transition"
                >
                  <BarChart3 className="w-4 h-4" />
                  Open Google Analytics
                </Link>
                <Link
                  href="https://support.google.com/analytics/answer/9304153"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Setup Guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<UserIcon className="w-6 h-6 text-cyan-500" />}
            title={dict.admin?.analyticsSeo?.features?.visitors?.title ?? 'Visitors'}
            description={dict.admin?.analyticsSeo?.features?.visitors?.description ?? 'Track unique visitors and page views across your site'}
          />
          <FeatureCard
            icon={<GlobeIcon className="w-6 h-6 text-green-500" />}
            title={dict.admin?.analyticsSeo?.features?.geography?.title ?? 'Geography'}
            description={dict.admin?.analyticsSeo?.features?.geography?.description ?? 'See where your visitors are coming from around the world'}
          />
          <FeatureCard
            icon={<Smartphone className="w-6 h-6 text-purple-500" />}
            title={dict.admin?.analyticsSeo?.features?.devices?.title ?? 'Devices'}
            description={dict.admin?.analyticsSeo?.features?.devices?.description ?? 'Understand which devices your audience uses'}
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6 text-blue-500" />}
            title={dict.admin?.analyticsSeo?.features?.referrers?.title ?? 'Referrers'}
            description={dict.admin?.analyticsSeo?.features?.referrers?.description ?? 'Discover how visitors find your site'}
          />
          <FeatureCard
            icon={<FileIcon className="w-6 h-6 text-amber-500" />}
            title={dict.admin?.analyticsSeo?.features?.topPages?.title ?? 'Top Pages'}
            description={dict.admin?.analyticsSeo?.features?.topPages?.description ?? 'See which pages get the most traffic'}
          />
        </div>

        {/* Setup Info */}
        <div className={`mt-6 rounded-2xl border border-dashed p-6 ${gaId ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'}`}>
          {gaId ? (
            <>
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                ✅ Analytics Active
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Google Analytics is tracking page views and visitor data on <strong>trainium.shop</strong>.
                Visit the Google Analytics Dashboard to view your analytics data.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                ⚠️ Setup Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                To enable Google Analytics:
              </p>
              <ol className="text-sm text-amber-700 dark:text-amber-300 list-decimal list-inside mt-2 space-y-1">
                <li>Go to <Link href="https://analytics.google.com" target="_blank" className="underline">analytics.google.com</Link></li>
                <li>Create a property for trainium.shop</li>
                <li>Get your Measurement ID (starts with G-)</li>
                <li>Add <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX</code> to your .env</li>
                <li>Restart your Docker container</li>
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
      <div className="mb-2">{icon}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </div>
  );
}
