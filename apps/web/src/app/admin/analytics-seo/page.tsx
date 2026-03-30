import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import Link from 'next/link';
import { BarChart3, ExternalLink } from 'lucide-react';
import { LookerStudioEmbed } from '@/components/admin/LookerStudioEmbed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LOOKER_LIGHT_URL =
  'https://lookerstudio.google.com/embed/reporting/78fa3de3-836b-4375-9a53-98dcc785d2a1/page/kIV1C';
const DEFAULT_LOOKER_DARK_URL =
  'https://lookerstudio.google.com/embed/reporting/1e0b6751-9276-4f33-a4b5-7bd7c9af08d5/page/kIV1C';

export default async function AdminAnalyticsSeoPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const lightReportUrl =
    process.env.NEXT_PUBLIC_LOOKER_STUDIO_REPORT_URL_LIGHT || DEFAULT_LOOKER_LIGHT_URL;
  const darkReportUrl =
    process.env.NEXT_PUBLIC_LOOKER_STUDIO_REPORT_URL_DARK || DEFAULT_LOOKER_DARK_URL;

  return (
    <div className="bg-ui-inset dark:bg-ui-base">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header + Admin Nav */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ui-primary">
                {dict.admin?.analyticsSeo?.title ?? 'Visitor Analytics'}
              </h1>
              <p className="text-ui-muted dark:text-ui-faint mt-1 text-sm sm:text-base">
                {dict.admin?.analyticsSeo?.subtitle ??
                  'Traffic, pages, devices, referrers and more.'}
              </p>
            </div>
          </div>
        </div>

        {/* Compact GA + Looker info bar */}
        <div className="mt-6 rounded-2xl border border-ui-default dark:border-ui-subtle glass-surface p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ui-primary">
                  {dict.admin?.analyticsSeo?.dataSource ?? 'Data source'}
                </h2>
                <p className="mt-0.5 text-sm text-ui-muted dark:text-ui-faint">
                  {gaId
                    ? `${dict.admin?.analyticsSeo?.gaConnected ?? 'Google Analytics'} (${gaId.substring(0, 12)}…)`
                    : dict.admin?.analyticsSeo?.gaNotConfigured ??
                      'Google Analytics not configured.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-ui-default dark:border-ui-subtle text-ui-secondary font-medium text-sm hover:bg-ui-inset dark:hover:bg-ui-elevated transition"
              >
                <ExternalLink className="w-4 h-4" />
                {dict.admin?.analyticsSeo?.openGA ?? 'Open GA'}
              </Link>
              <Link
                href="https://lookerstudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-ui-default dark:border-ui-subtle text-ui-secondary font-medium text-sm hover:bg-ui-inset dark:hover:bg-ui-elevated transition"
              >
                <ExternalLink className="w-4 h-4" />
                {dict.admin?.analyticsSeo?.openLooker ?? 'Looker Studio'}
              </Link>
            </div>
          </div>
        </div>

        {/* Looker Studio embed */}
        <div className="mt-6">
          <LookerStudioEmbed
            lightReportUrl={lightReportUrl}
            darkReportUrl={darkReportUrl}
            lang={lang}
            minHeight={1200}
          />
        </div>

        {/* Setup hint when GA not configured */}
        {!gaId && (
          <div className="mt-6 rounded-2xl border border-dashed border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5">
            <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              ⚠️ {dict.admin?.analyticsSeo?.setupRequired ?? 'Setup Required'}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {dict.admin?.analyticsSeo?.gaSetupHint ??
                'Add NEXT_PUBLIC_GA_MEASUREMENT_ID to your .env to track visitors. The dashboard above uses Looker Studio connected to your GA property.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
