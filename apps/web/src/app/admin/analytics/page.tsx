import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '../../../lib/db';
import { formatCurrency } from '../../../lib/format';
import { AnalyticsClient } from '../../../components/admin/AnalyticsClient';
import { getDictionary, negotiateLocale } from '../../../lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RangeKey = '7d' | '30d' | '90d';

function getRangeStart(range: RangeKey): Date {
  const now = new Date();
  const start = new Date(now);
  if (range === '7d') start.setDate(now.getDate() - 7);
  else if (range === '90d') start.setDate(now.getDate() - 90);
  else start.setDate(now.getDate() - 30);
  // normalize to midnight for consistent bucketing
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildDaySeries(start: Date, end: Date) {
  const series: { day: string; orders: number; revenue: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = new Date(cursor).toISOString().slice(0, 10);
    series.push({ day: key, orders: 0, revenue: 0 });
    cursor.setDate(cursor.getDate() - 0 + 1);
  }
  return series;
}

async function getAnalytics(params?: { range?: string; sort?: 'revenue' | 'units'; provider?: 'ALL' | 'STRIPE' | 'TOSS' }) {
  const now = new Date();
  const range = (params?.range as RangeKey) || '30d';
  const start = getRangeStart(range);
  const provider = params?.provider || 'ALL';
  const sortMetric = params?.sort || 'revenue';

  const [
    totals,
    ordersByDayRaw,
    revenueByDayRaw,
    topProductsRaw,
    byStatus,
    byProvider,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalCents: true, subtotalCents: true, shippingCents: true, discountCents: true },
      _count: { _all: true },
      where: { createdAt: { gte: start } },
    }),
    prisma.$queryRawUnsafe<any[]>(
      `select date_trunc('day', o."createdAt") as day, count(*)::int as orders
       from "Order" o
       where o."createdAt" >= $1
       group by 1
       order by 1 asc`,
      start,
    ),
    prisma.$queryRawUnsafe<any[]>(
      `select date_trunc('day', p."createdAt") as day, sum(p."amountCents")::int as revenue
       from "Payment" p
       where p."createdAt" >= $1 and p.status = 'SUCCEEDED' ${provider !== 'ALL' ? `and p.provider = '${provider}'` : ''}
       group by 1
       order by 1 asc`,
      start,
    ),
    prisma.$queryRawUnsafe<any[]>(
      `select 
         oi."productId" as id, 
         max(oi.name) as name, 
         sum(oi.qty)::int as units, 
         sum(oi."priceCents" * oi.qty)::int as revenue
       from "OrderItem" oi
       join "Order" o on o.id = oi."orderId"
       join "Payment" p on p."orderId" = o.id and p.status = 'SUCCEEDED' ${provider !== 'ALL' ? `and p.provider = '${provider}'` : ''}
       where o."createdAt" >= $1
       group by oi."productId"
       order by ${sortMetric === 'units' ? 'units' : 'revenue'} desc
       limit 10`,
      start,
    ),
    prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { createdAt: { gte: start } },
    }),
    prisma.payment.groupBy({
      by: ['provider'],
      _sum: { amountCents: true },
      _count: { _all: true },
      where: { createdAt: { gte: start }, status: 'SUCCEEDED' },
    }),
  ]);

  // Merge daily series so we always show each day in range
  const days = buildDaySeries(start, now);
  const ordersByKey = new Map<string, number>(
    ordersByDayRaw.map((d) => [new Date(d.day).toISOString().slice(0, 10), Number(d.orders) || 0])
  );
  const revenueByKey = new Map<string, number>(
    revenueByDayRaw.map((d) => [new Date(d.day).toISOString().slice(0, 10), Number(d.revenue) || 0])
  );
  const ordersByDay = days.map((d) => ({
    day: d.day,
    orders: ordersByKey.get(d.day) ?? 0,
    revenue: revenueByKey.get(d.day) ?? 0,
  }));

  return { totals, ordersByDay, topProducts: topProductsRaw, byStatus, byProvider, range, provider, sort: sortMetric };
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; sort?: 'revenue' | 'units'; provider?: 'ALL' | 'STRIPE' | 'TOSS' }>
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const params = await searchParams;
  const data = await getAnalytics({ range: params?.range, sort: params?.sort, provider: params?.provider });

  const revenue = data.totals._sum.totalCents ?? 0;
  const orders = data.totals._count._all ?? 0;
  const avgOrder = orders > 0 ? Math.round(revenue / orders) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{dict.admin?.analytics?.title ?? 'Analytics'}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">{dict.admin?.analytics?.subtitle ?? 'Key business metrics at a glance.'}</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
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
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.notifications ?? 'Notifications'}
          </Link>
          <Link
            href={`/${lang}/admin/analytics`}
            className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-medium"
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

        {/* Controls */}
        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.range ?? 'Range'}</label>
            <select name="range" defaultValue={data.range} className="h-9 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <option value="7d">{dict.admin?.analytics?.range7d ?? 'Last 7 days'}</option>
              <option value="30d">{dict.admin?.analytics?.range30d ?? 'Last 30 days'}</option>
              <option value="90d">{dict.admin?.analytics?.range90d ?? 'Last 90 days'}</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.provider ?? 'Provider'}</label>
            <select name="provider" defaultValue={data.provider} className="h-9 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <option value="ALL">{dict.admin?.analytics?.all ?? 'All'}</option>
              <option value="STRIPE">{dict.admin?.analytics?.stripe ?? 'Stripe'}</option>
              <option value="TOSS">{dict.admin?.analytics?.toss ?? 'Toss'}</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.topProducts ?? 'Top Products'}</label>
            <select name="sort" defaultValue={data.sort} className="h-9 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <option value="revenue">{dict.admin?.analytics?.byRevenue ?? 'By Revenue'}</option>
              <option value="units">{dict.admin?.analytics?.byUnits ?? 'By Units'}</option>
            </select>
          </div>
          <button type="submit" className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition text-xs sm:text-sm">{dict.admin?.analytics?.apply ?? 'Apply'}</button>
        </form>

        {/* KPI cards */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-white dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.revenue ?? 'Revenue'}</div>
            <div className="mt-2 text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(revenue, 'KRW')}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.orders ?? 'Orders'}</div>
            <div className="mt-2 text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{orders}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900 p-4 sm:p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{dict.admin?.analytics?.aov ?? 'Avg. Order Value'}</div>
            <div className="mt-2 text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(avgOrder, 'KRW')}</div>
          </div>
        </div>

      <AnalyticsClient
        daily={data.ordersByDay}
        topProducts={data.topProducts}
        byStatus={data.byStatus}
        providerBuckets={data.byProvider.map(p => ({ provider: p.provider, revenue: p._sum.amountCents || 0, count: p._count._all }))}
      />

        {/* Status distribution */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div className="mb-3 font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">{dict.admin?.analytics?.ordersByStatus ?? 'Orders by Status'}</div>
            <div className="grid grid-cols-2 gap-2">
              {data.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-2 sm:p-3">
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">{s.status}</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{s._count._all}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div className="mb-3 font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">{dict.admin?.analytics?.topProductsHeader ?? 'Top Products'} ({data.sort === 'units' ? (dict.admin?.analytics?.byUnits ?? 'by Units') : (dict.admin?.analytics?.byRevenue ?? 'by Revenue')})</div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.topProducts.map((p, idx) => (
                <div key={`${p.id}-${idx}`} className="py-2 sm:py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.units} units</div>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 ml-2">{formatCurrency(p.revenue, 'KRW')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


