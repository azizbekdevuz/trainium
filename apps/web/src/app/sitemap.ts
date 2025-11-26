import type { MetadataRoute } from 'next';
import { prisma } from '../lib/database/db';

const DOMAIN = 'https://trainium.shop';
const LOCALES = ['en', 'ko', 'uz'] as const;
type AppLocale = typeof LOCALES[number];

function localizedUrl(path: string, locale: AppLocale) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${DOMAIN}/${locale}${normalized === '/' ? '' : normalized}`.replace(/\/+/g, '/').replace('https:/', 'https://');
}

function alternatesFor(path: string) {
  return {
    languages: LOCALES.reduce<Record<string, string>>((acc, l) => {
      acc[l] = localizedUrl(path, l);
      return acc;
    }, {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths = [
    '/', // home
    '/products',
    '/special-bargain',
    '/about',
    '/contact',
    '/track',
  ];

  // Fetch slugs for dynamic entities
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Root homepage (canonical) with language alternates
  entries.push({
    url: DOMAIN,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1,
    alternates: alternatesFor('/'),
  });

  // Static entries (per locale with alternates)
  for (const p of staticPaths) {
    entries.push({
      url: localizedUrl(p, 'en'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: p === '/' ? 1 : 0.7,
      alternates: alternatesFor(p),
    });
  }

  // Category listing pages (optional if you have category routes as query params; skip if not routed by slug)
  for (const c of categories) {
    const path = `/products?category=${encodeURIComponent(c.slug)}`;
    entries.push({
      url: localizedUrl(path, 'en'),
      lastModified: c.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: alternatesFor(path),
    });
  }

  // Product pages
  for (const prod of products) {
    const path = `/products/${encodeURIComponent(prod.slug)}`;
    entries.push({
      url: localizedUrl(path, 'en'),
      lastModified: prod.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: alternatesFor(path),
    });
  }

  return entries;
}


