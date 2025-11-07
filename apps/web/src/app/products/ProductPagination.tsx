import Link from 'next/link';
import type { ParsedSearchParams } from './types';
import type { Dictionary } from '../../lib/i18n';

interface ProductPaginationProps {
  lang: string;
  dict: Dictionary;
  params: ParsedSearchParams;
  nextCursor?: string;
  prevCursor?: string;
  productCount: number;
}

export function ProductPagination({
  lang,
  dict,
  params,
  nextCursor,
  prevCursor,
  productCount,
}: ProductPaginationProps) {
  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <PageLinkCursor
        disabled={!params.cursor}
        q={params.q}
        category={params.category}
        inStock={params.inStock ? '1' : '0'}
        min={Number.isFinite(params.min) ? params.min : undefined}
        max={Number.isFinite(params.max) ? params.max : undefined}
        sort={params.sort as any}
        cursor={prevCursor}
        dir={'back'}
        brand={params.brand}
        brands={params.brandsSelected}
        categories={params.categoriesSelected}
        lang={lang}
      >
        {dict.pages.products.prev}
      </PageLinkCursor>
      <span className="text-sm text-gray-600">
        {productCount} {dict.pages.products.shown}
      </span>
      <PageLinkCursor
        disabled={!nextCursor}
        q={params.q}
        category={params.category}
        inStock={params.inStock ? '1' : '0'}
        min={Number.isFinite(params.min) ? params.min : undefined}
        max={Number.isFinite(params.max) ? params.max : undefined}
        sort={params.sort as any}
        cursor={nextCursor}
        dir={'forward'}
        brand={params.brand}
        brands={params.brandsSelected}
        categories={params.categoriesSelected}
        lang={lang}
      >
        {dict.pages.products.next}
      </PageLinkCursor>
    </div>
  );
}

function PageLinkCursor({
  disabled,
  q,
  category,
  inStock,
  min,
  max,
  sort,
  cursor,
  dir,
  brand,
  brands,
  categories,
  lang,
  children,
}: {
  disabled: boolean;
  q: string;
  category: string;
  inStock?: '1' | '0';
  min?: number;
  max?: number;
  sort?: 'new' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
  cursor?: string;
  dir: 'forward' | 'back';
  brand?: string;
  brands?: string[];
  categories?: string[];
  lang: string;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (Array.isArray(categories)) categories.forEach((c) => params.append('categories', c));
  if (cursor) params.set('cursor', cursor);
  params.set('dir', dir);
  if (typeof min === 'number' && Number.isFinite(min)) params.set('min', String(min));
  if (typeof max === 'number' && Number.isFinite(max)) params.set('max', String(max));
  if (sort) params.set('sort', sort);
  if (inStock) params.set('inStock', inStock);
  if (brand) params.set('brand', brand);
  if (Array.isArray(brands)) brands.forEach((b) => params.append('brands', b));

  return disabled ? (
    <span className="px-3 py-1 text-gray-400">{children}</span>
  ) : (
    <Link
      href={`/${lang}/products?${params.toString()}`}
      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}

