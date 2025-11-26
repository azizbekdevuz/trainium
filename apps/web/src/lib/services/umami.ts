import 'server-only';

const UMAMI_API_URL = process.env.UMAMI_API_URL;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;
const UMAMI_API_TOKEN = process.env.UMAMI_API_TOKEN;

export function isUmamiConfigured(): boolean {
  return Boolean(UMAMI_API_URL && UMAMI_WEBSITE_ID && UMAMI_API_TOKEN);
}

function getHeaders() {
  return {
    Authorization: `Bearer ${UMAMI_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function toMs(date: Date) {
  return date.getTime();
}

export function getRangeStart(range: '7d' | '30d' | '90d'): Date {
  const now = new Date();
  const start = new Date(now);
  if (range === '7d') start.setDate(now.getDate() - 7);
  else if (range === '90d') start.setDate(now.getDate() - 90);
  else start.setDate(now.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return start;
}

async function fetchUmami<T>(path: string, params: Record<string, string | number | boolean>) {
  if (!UMAMI_API_URL || !UMAMI_WEBSITE_ID || !UMAMI_API_TOKEN) {
    throw new Error('Umami is not configured');
  }
  // UMAMI_API_URL should point to the API base:
  // - Self-hosted: https://my-umami-domain/api
  // - Cloud:       https://api.umami.is/v1
  // We append /websites/{id}/{path} regardless of host
  const base = UMAMI_API_URL.replace(/\/+$/, '');
  const url = new URL(`${base}/websites/${UMAMI_WEBSITE_ID}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Umami API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export type UmamiStats = {
  pageviews: { value: number };
  visitors: { value: number };
  bouncerate?: { value: number };
  totaltime?: { value: number };
};

export async function getStats(range: '7d' | '30d' | '90d') {
  const endAt = new Date();
  const startAt = getRangeStart(range);
  return await fetchUmami<UmamiStats>('stats', {
    startAt: toMs(startAt),
    endAt: toMs(endAt),
  });
}

type MetricRow = { x: string; y: number };
type MetricsResponse = { data: MetricRow[] };

export async function getMetrics(type: 'url' | 'referrer' | 'browser' | 'os' | 'device' | 'country', range: '7d' | '30d' | '90d') {
  const endAt = new Date();
  const startAt = getRangeStart(range);
  return await fetchUmami<MetricsResponse>('metrics', {
    type,
    startAt: toMs(startAt),
    endAt: toMs(endAt),
  });
}


