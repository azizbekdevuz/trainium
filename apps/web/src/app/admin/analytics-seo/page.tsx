import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import { isUmamiConfigured, getStats, getMetrics } from '@/lib/services/umami';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RangeKey = '7d' | '30d' | '90d';

export default async function AdminAnalyticsSeoPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: RangeKey }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const sp = await searchParams;
  const range = (sp?.range as RangeKey) || '30d';

  const configured = isUmamiConfigured();
  let stats: Awaited<ReturnType<typeof getStats>> | null = null;
  let topPages: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let referrers: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let devices: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let browsers: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let oses: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let countries: Awaited<ReturnType<typeof getMetrics>> | null = null;

  if (configured) {
    try {
      [stats, topPages, referrers, devices, browsers, oses, countries] = await Promise.all([
        getStats(range),
        getMetrics('url', range),
        getMetrics('referrer', range),
        getMetrics('device', range),
        getMetrics('browser', range),
        getMetrics('os', range),
        getMetrics('country', range),
      ]);
    //eslint-disable-next-line @typescript-eslint/no-unused-vars    
    } catch (e) {
      // fall back to empty if API fails
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
      stats = null;
    }
  }

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

        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {dict.admin?.analyticsSeo?.range ?? 'Range'}
            </label>
            <select name="range" defaultValue={range} className="h-9 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <option value="7d">{dict.admin?.analytics?.range7d ?? 'Last 7 days'}</option>
              <option value="30d">{dict.admin?.analytics?.range30d ?? 'Last 30 days'}</option>
              <option value="90d">{dict.admin?.analytics?.range90d ?? 'Last 90 days'}</option>
            </select>
          </div>
          <button type="submit" className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition text-xs sm:text-sm">
            {dict.admin?.analytics?.apply ?? 'Apply'}
          </button>
        </form>

        {!configured && (
          <div className="mt-6 rounded-2xl border border-dashed p-6 bg-white dark:bg-slate-900">
            <div className="text-slate-800 dark:text-slate-100 font-medium mb-2">{dict.admin?.analyticsSeo?.notConfiguredTitle ?? 'Umami is not configured'}</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {dict.admin?.analyticsSeo?.notConfiguredBody ?? 'Set UMAMI_API_URL, UMAMI_WEBSITE_ID, and UMAMI_API_TOKEN env variables and redeploy.'}
            </p>
          </div>
        )}

        {configured && stats && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">{dict.admin?.analyticsSeo?.visitors ?? 'Visitors'}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.visitors?.value ?? 0}</div>
            </div>
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">{dict.admin?.analyticsSeo?.pageviews ?? 'Pageviews'}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.pageviews?.value ?? 0}</div>
            </div>
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">{dict.admin?.analyticsSeo?.bounce ?? 'Bounce rate'}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {typeof stats.bouncerate?.value === 'number' ? `${Math.round(stats.bouncerate.value)}%` : '—'}
              </div>
            </div>
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">{dict.admin?.analyticsSeo?.time ?? 'Total time'}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {typeof stats.totaltime?.value === 'number' ? `${Math.round(stats.totaltime.value / 60)}m` : '—'}
              </div>
            </div>
          </div>
        )}

        {configured && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetricCard title={dict.admin?.analyticsSeo?.topPages ?? 'Top pages'} rows={topPages?.data} formatter={(x) => x} />
            <MetricCard title={dict.admin?.analyticsSeo?.referrers ?? 'Referrers'} rows={referrers?.data} formatter={(x) => x} />
            <MetricCard title={dict.admin?.analyticsSeo?.devices ?? 'Devices'} rows={devices?.data} formatter={(x) => x} />
            <MetricCard title={dict.admin?.analyticsSeo?.browsers ?? 'Browsers'} rows={browsers?.data} formatter={(x) => x} />
            <MetricCard title={dict.admin?.analyticsSeo?.oses ?? 'Operating systems'} rows={oses?.data} formatter={(x) => x} />
            <MetricCard title={dict.admin?.analyticsSeo?.countries ?? 'Countries'} rows={countries?.data} formatter={(x) => x.toUpperCase()} />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, rows, formatter }: { title: string; rows?: { x: string; y: number }[] | null; formatter: (x: string) => string }) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
      <div className="mb-3 font-medium text-slate-900 dark:text-slate-100">{title}</div>
      <div className="space-y-2">
        {(rows ?? []).slice(0, 10).map((r, i) => (
          <div key={`${r.x}-${i}`} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{formatter(r.x || '—')}</div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: widthPct(rows ?? [], r.y) }} />
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium text-slate-900 dark:text-slate-100">{r.y}</div>
          </div>
        ))}
        {(rows ?? []).length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">—</div>}
      </div>
    </div>
  );
}

function widthPct(rows: { y: number }[], y: number) {
  const max = rows.reduce((m, r) => Math.max(m, r.y), 0) || 1;
  return `${Math.min(100, (y / max) * 100)}%`;
}


