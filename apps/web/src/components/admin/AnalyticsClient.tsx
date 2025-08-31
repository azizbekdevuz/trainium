'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/format';
import { useI18n } from '../providers/I18nProvider';

type DailyPoint = { day: string; orders: number; revenue: number };
type TopProduct = { id: string; name: string; units: number; revenue: number };
type StatusBucket = { status: string; _count: { _all: number } };

export function AnalyticsClient({
  daily,
  topProducts,
  byStatus,
  currency = 'KRW',
  providerBuckets,
}: {
  daily: DailyPoint[];
  topProducts: TopProduct[];
  byStatus: StatusBucket[];
  currency?: string;
  providerBuckets?: { provider: 'STRIPE' | 'TOSS' | string; revenue: number; count: number }[];
}) {
  const { t, lang } = useI18n();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { maxOrders, maxRevenue } = useMemo(() => {
    let mo = 0;
    let mr = 0;
    for (const d of daily) {
      if (d.orders > mo) mo = d.orders;
      if (d.revenue > mr) mr = d.revenue;
    }
    return { maxOrders: mo || 1, maxRevenue: mr || 1 };
  }, [daily]);

  const svgWidth = 900;
  const svgHeight = 220;
  const padding = { top: 10, right: 20, bottom: 24, left: 36 };
  const innerW = svgWidth - padding.left - padding.right;
  const innerH = svgHeight - padding.top - padding.bottom;

  const points = useMemo(() => {
    const n = daily.length || 1;
    const gap = innerW / Math.max(1, n - 1);
    return daily.map((d, i) => {
      const x = padding.left + i * gap;
      const ordersPct = d.orders / maxOrders;
      const revenuePct = d.revenue / maxRevenue;
      const ordersY = padding.top + innerH * (1 - ordersPct);
      const revenueY = padding.top + innerH * (1 - revenuePct);
      return { x, ordersY, revenueY };
    });
  }, [daily, innerW, innerH, maxOrders, maxRevenue, padding.left, padding.top]);

  const revenuePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.revenueY}`)
      .join(' ');
  }, [points]);

  function downloadCsv() {
    const lines: string[] = [];
    lines.push('Analytics Export');
    lines.push('');
    lines.push('Daily Series');
    lines.push('date,orders,revenue');
    for (const d of daily) {
      lines.push(`${d.day},${d.orders},${d.revenue}`);
    }
    lines.push('');
    lines.push('Top Products');
    lines.push('name,units,revenue');
    for (const p of topProducts) {
      lines.push(`${escapeCsv(p.name)},${p.units},${p.revenue}`);
    }
    lines.push('');
    lines.push('Orders by Status');
    lines.push('status,count');
    for (const s of byStatus) {
      lines.push(`${s.status},${s._count._all}`);
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={downloadCsv}
          className="h-10 px-4 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
        >
          {t('admin.analytics.exportCsv', 'Export CSV')}
        </button>
      </div>

      {/* Daily chart */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 font-medium">{t('admin.analytics.dailyHeader', 'Orders & Revenue (daily)')}</div>
        <div className="w-full overflow-x-auto">
          <svg width={svgWidth} height={svgHeight} className="min-w-full">
            {/* axes */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#E5E7EB" />
            <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#E5E7EB" />

            {/* revenue line */}
            <path d={revenuePath} fill="none" stroke="#6366F1" strokeWidth={2} />

            {/* orders bars */}
            {points.map((p, i) => (
              <rect
                key={`ob-${i}`}
                x={p.x - 6}
                width={12}
                y={p.ordersY}
                height={padding.top + innerH - p.ordersY}
                fill="#06B6D4"
                opacity={hoverIdx === i ? 1 : 0.85}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            ))}

            {/* hover dots for revenue */}
            {points.map((p, i) => (
              <circle
                key={`rv-${i}`}
                cx={p.x}
                cy={p.revenueY}
                r={hoverIdx === i ? 4 : 3}
                fill="#6366F1"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            ))}
          </svg>
        </div>

        {/* legend + tooltip */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> {t('admin.analytics.legendOrders', 'Orders')}</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> {t('admin.analytics.legendRevenue', 'Revenue')}</span>
          </div>
          {hoverIdx !== null && daily[hoverIdx] && (
            <div className="px-2 py-1 rounded bg-gray-100 text-gray-700">
              <span className="font-medium mr-2">{new Date(daily[hoverIdx].day).toLocaleDateString(lang)}</span>
              <span className="mr-2">{daily[hoverIdx].orders} {t('admin.analytics.orders', 'Orders').toLowerCase()}</span>
              <span>{formatCurrency(daily[hoverIdx].revenue, currency)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders by status */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-3 font-medium">{t('admin.analytics.ordersByStatus', 'Orders by Status')}</div>
          <div className="space-y-2">
            {byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <div className="w-28 text-sm text-gray-600">{s.status}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (s._count._all / Math.max(1, maxStatus(byStatus))) * 100)}%` }} />
                </div>
                <div className="w-10 text-right text-sm font-medium">{s._count._all}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-3 font-medium">{t('admin.analytics.topProductsHeader', 'Top Products')}</div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={`${p.id}-${i}`} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate pr-2">{p.name}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{p.units} {t('admin.analytics.units', 'units')} • {formatCurrency(p.revenue, currency)}</div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (p.revenue / Math.max(1, maxRevenueProducts(topProducts))) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel breakdown */}
      {providerBuckets && providerBuckets.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-3 font-medium">{t('admin.analytics.channelBreakdown', 'Channel Breakdown')}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue */}
            <div>
              <div className="text-sm text-gray-600 mb-2">{t('admin.analytics.revenue', 'Revenue')}</div>
              <div className="space-y-2">
                {providerBuckets.map((b) => (
                  <div key={`rev-${b.provider}`} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{b.provider}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scale(b.revenue, providerBuckets.map(p=>p.revenue))}%` }} />
                    </div>
                    <div className="w-28 text-right text-sm font-medium">{formatCurrency(b.revenue, currency)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders count */}
            <div>
              <div className="text-sm text-gray-600 mb-2">{t('admin.analytics.orders', 'Orders')}</div>
              <div className="space-y-2">
                {providerBuckets.map((b) => (
                  <div key={`cnt-${b.provider}`} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{b.provider}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${scale(b.count, providerBuckets.map(p=>p.count))}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{b.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSV for channel breakdown */}
          <div className="mt-4 text-right">
            <button
              onClick={() => downloadCsvProviders(providerBuckets)}
              className="h-9 px-3 rounded-lg border text-sm hover:bg-gray-50"
            >
              {t('admin.analytics.exportChannelsCsv', 'Export Channels CSV')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function maxStatus(buckets: StatusBucket[]) {
  return buckets.reduce((m, b) => Math.max(m, b._count._all), 0);
}

function maxRevenueProducts(list: TopProduct[]) {
  return list.reduce((m, p) => Math.max(m, p.revenue), 0);
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function scale(value: number, list: number[]) {
  const max = list.reduce((m, v) => Math.max(m, v), 0) || 1;
  return Math.min(100, (value / max) * 100);
}

function downloadCsvProviders(buckets: { provider: string; revenue: number; count: number }[]) {
  const lines: string[] = [];
  lines.push('Channel Breakdown');
  lines.push('provider,revenue,count');
  for (const b of buckets) lines.push(`${b.provider},${b.revenue},${b.count}`);
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `channels_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


