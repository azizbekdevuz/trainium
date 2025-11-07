import type { ParsedSearchParams } from './types';

export function normalizeMulti(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function buildWhereClause(params: ParsedSearchParams) {
  const { q, categoriesSelected, category, brandsSelected, brand, currency, withVar, min, max, inStock } = params;

  const where: any = {
    active: true,
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    ...(categoriesSelected.length
      ? { categories: { some: { slug: { in: categoriesSelected } } } }
      : category
      ? { categories: { some: { slug: category } } }
      : {}),
    ...(brandsSelected.length
      ? { brand: { in: brandsSelected } }
      : brand
      ? { brand: { equals: brand } }
      : {}),
    ...(currency ? { currency } : {}),
    ...(withVar ? { variants: { some: {} } } : {}),
    ...(Number.isFinite(min) || Number.isFinite(max)
      ? {
          OR: [
            { priceCents: { ...(Number.isFinite(min) ? { gte: min } : {}), ...(Number.isFinite(max) ? { lte: max } : {}) } },
            { variants: { some: { priceCents: { ...(Number.isFinite(min) ? { gte: min } : {}), ...(Number.isFinite(max) ? { lte: max } : {}) } } } },
          ],
        }
      : {}),
    ...(inStock ? { inventory: { is: { inStock: { gt: 0 } } } } : {}),
  };

  return where;
}

export function buildOrderBy(sort: ParsedSearchParams['sort']) {
  return sort === 'price-asc'
    ? [{ priceCents: 'asc' as const }, { id: 'asc' as const }]
    : sort === 'price-desc'
    ? [{ priceCents: 'desc' as const }, { id: 'desc' as const }]
    : sort === 'name-asc'
    ? [{ name: 'asc' as const }, { id: 'asc' as const }]
    : sort === 'name-desc'
    ? [{ name: 'desc' as const }, { id: 'desc' as const }]
    : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
}

