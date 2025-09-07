import { prisma } from '../../lib/db';
import Link from 'next/link';
import { ProductCard } from '../../components/ProductCard';
import { ProductWithRelations } from '../../types/prisma';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { getDictionary, negotiateLocale } from '../../lib/i18n';
import { auth } from '../../auth';
import { Prisma } from '@prisma/client';
import { getCategoryDisplayName, sortCategories } from '../../lib/category-utils';

type SearchParams = {
  q?: string;
  category?: string;
  inStock?: string;
  min?: string;
  max?: string;
  sort?: 'new' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
  cursor?: string;
  dir?: 'forward' | 'back';
  brand?: string;
  currency?: string;
  withVar?: string;
};

type Props = {
  searchParams?: Promise<SearchParams>;
};

const PAGE_SIZE = 12;
export const revalidate = 60; // ISR every 60s

export default async function ProductsPage({ searchParams }: Props) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const session = await auth();
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? '').trim();
  const category = (sp.category ?? '').trim();
  const min = Number(sp.min ?? '0');
  const max = Number(sp.max ?? '50000000');
  const sort = (sp.sort ?? 'new') as NonNullable<SearchParams['sort']>;
  const inStock = (sp.inStock ?? '1') === '1';
  const cursor = (sp.cursor ?? '').trim();
  const dir = (sp.dir ?? 'forward') as 'forward' | 'back';
  const brand = (sp.brand ?? '').trim();
  const currency = (sp.currency ?? '').trim();
  const withVar = (sp.withVar ?? '0') === '1';

  const normalizeMulti = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  };

  let categoriesSelected = normalizeMulti((sp as any).categories);
  if (categoriesSelected.length === 0 && category) categoriesSelected = [category];
  let brandsSelected = normalizeMulti((sp as any).brands);
  if (brandsSelected.length === 0 && brand) brandsSelected = [brand];

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

  const orderBy =
    sort === 'price-asc'
      ? [{ priceCents: 'asc' as const }, { id: 'asc' as const }]
      : sort === 'price-desc'
      ? [{ priceCents: 'desc' as const }, { id: 'desc' as const }]
      : sort === 'name-asc'
      ? [{ name: 'asc' as const }, { id: 'asc' as const }]
      : sort === 'name-desc'
      ? [{ name: 'desc' as const }, { id: 'desc' as const }]
      : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

  const [rawCategories, pageItems, brands, currencies] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where,
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      take: (dir === 'back' ? -1 : 1) * (PAGE_SIZE + 1),
      skip: cursor ? 1 : 0,
      include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
    }) as Promise<ProductWithRelations[]>,
    prisma.product.findMany({
      where: { active: true, brand: { not: null } },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    }),
    prisma.product.findMany({
      where: { active: true },
      distinct: ['currency'],
      select: { currency: true },
      orderBy: { currency: 'asc' },
    }),
  ]);

  // Sort categories with translated names
  const categories = sortCategories(rawCategories, dict);

  const items = dir === 'back' ? [...pageItems].reverse() : pageItems;
  const hasMore = items.length > PAGE_SIZE;
  const slice = items.slice(0, PAGE_SIZE);
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined;
  const prevCursor = slice[0]?.id && (cursor ? slice[0].id : undefined);
  const currencyOptions = Array.from(new Set(['USD', 'KRW', 'EUR', ...currencies.map((c) => c.currency)])).filter(Boolean);

  // Prefetch counts and states for visible products
  const visibleIds = slice.map((p) => p.id);
  let favCounts: { productId: string; count: number }[] = [];
  let likeCounts: { productId: string; count: number }[] = [];
  let userFavs: { productId: string }[] = [];
  let userLikes: { productId: string }[] = [];
  if (visibleIds.length) {
    [favCounts, likeCounts] = await Promise.all([
      prisma.$queryRaw<{ productId: string; count: number }[]>`SELECT "productId", COUNT(*)::int AS count FROM "Favorite" WHERE "productId" IN (${Prisma.join(visibleIds)}) GROUP BY "productId"`,
      prisma.$queryRaw<{ productId: string; count: number }[]>`SELECT "productId", COUNT(*)::int AS count FROM "ProductLike" WHERE "productId" IN (${Prisma.join(visibleIds)}) GROUP BY "productId"`,
    ]);
    if (session?.user?.id) {
      [userFavs, userLikes] = await Promise.all([
        prisma.$queryRaw<{ productId: string }[]>`SELECT "productId" FROM "Favorite" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(visibleIds)})`,
        prisma.$queryRaw<{ productId: string }[]>`SELECT "productId" FROM "ProductLike" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(visibleIds)})`,
      ]);
    }
  }
  const favCountById = new Map(favCounts.map((r) => [r.productId, r.count]));
  const likeCountById = new Map(likeCounts.map((r) => [r.productId, r.count]));
  const userFavSet = new Set(userFavs.map((r) => r.productId));
  const userLikeSet = new Set(userLikes.map((r) => r.productId));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h2 className="font-display text-3xl">{dict.pages.products.title}</h2>
          <p className="text-gray-600">{dict.pages.products.subtitle}</p>
        </div>

        {/* Merchandising zones */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/${lang}/products?inStock=1&max=100000&sort=new`}
            className="group rounded-2xl border bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-cyan-700 font-semibold">{dict.pages.products.hotDeals}</div>
              <div className="text-gray-600 text-sm">{dict.pages.products.hotDealsDesc}</div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-700">{dict.nav.shop} →</span>
          </Link>
          <Link
            href={`/${lang}/special-bargain`}
            className="group rounded-2xl border bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-cyan-700 font-semibold">{dict.pages.products.cashback}</div>
              <div className="text-gray-600 text-sm">{dict.pages.products.cashbackDesc}</div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-700">{dict.pages.products.learnMore}</span>
          </Link>
        </div>

        <form className="glass rounded-2xl p-4 lg:sticky lg:top-16 lg:z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.searchLabel ?? 'Search'}</span>
              <input
                aria-label={dict.pages.products.searchAria ?? 'Search products'}
                name="q"
                defaultValue={q}
                placeholder={dict.pages.products.searchPh ?? 'e.g. dumbbell, bike'}
                className="h-11 w-full rounded-xl border px-3"
              />
              <span className="mt-1 block text-[11px] text-gray-500">{dict.pages.products.searchInEnglish ?? ''}</span>
            </label>

            <div className="lg:col-span-2">
              <MultiSelect
                name="categories"
                label={dict.admin?.products?.categories ?? 'Categories'}
                options={categories.map((c) => ({ value: c.slug, label: getCategoryDisplayName(c, dict) }))}
                defaultSelected={categoriesSelected}
              />
            </div>

            {brands.length > 0 && (
              <div className="lg:col-span-2">
                <MultiSelect
                  name="brands"
                  label={dict.pages.products.brands ?? 'Brands'}
                  options={brands.map((b) => ({ value: b.brand ?? '', label: b.brand ?? '' }))}
                  defaultSelected={brandsSelected}
                />
              </div>
            )}

            {currencyOptions.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.currency ?? 'Currency'}</span>
                <select
                  aria-label={dict.pages.products.currencyAria ?? 'Currency filter'}
                  name="currency"
                  defaultValue={currency}
                  className="h-11 w-full rounded-xl border px-3"
                >
                  <option value="">{dict.pages.products.all ?? 'All'}</option>
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.availability ?? 'Availability'}</span>
              <select
                aria-label={dict.pages.products.availabilityAria ?? 'Availability filter'}
                name="inStock"
                defaultValue={inStock ? '1' : '0'}
                className="h-11 w-full rounded-xl border px-3"
              >
                <option value="1">{dict.pages.products.inStock ?? 'In stock'}</option>
                <option value="0">{dict.pages.products.allItems ?? 'All items'}</option>
              </select>
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.variants ?? 'Variants'}</span>
              <select
                aria-label={dict.pages.products.variantsAria ?? 'With variants'}
                name="withVar"
                defaultValue={withVar ? '1' : '0'}
                className="h-11 w-full rounded-xl border px-3"
              >
                <option value="0">{dict.pages.products.any ?? 'Any'}</option>
                <option value="1">{dict.pages.products.onlyWithVariants ?? 'Only with variants'}</option>
              </select>
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.minPrice ?? 'Min price (₩)'}</span>
              <input
                aria-label={dict.pages.products.minPriceAria ?? 'Minimum price'}
                name="min"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={Number.isFinite(min) ? String(min) : ''}
                placeholder={dict.pages.products.minPh ?? '0'}
                className="h-11 w-full rounded-xl border px-3"
              />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.maxPrice ?? 'Max price (₩)'}</span>
              <input
                aria-label={dict.pages.products.maxPriceAria ?? 'Maximum price'}
                name="max"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={Number.isFinite(max) ? String(max) : ''}
                placeholder={dict.pages.products.maxPh ?? '5000000'}
                className="h-11 w-full rounded-xl border px-3"
              />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.sortBy ?? 'Sort by'}</span>
              <select
                aria-label={dict.pages.products.sortAria ?? 'Sort order'}
                name="sort"
                defaultValue={sort}
                className="h-11 w-full rounded-xl border px-3"
              >
                <option value="new">{dict.pages.products.sortNewest ?? 'Newest'}</option>
                <option value="price-asc">{dict.pages.products.sortPriceAsc ?? 'Price: Low to High'}</option>
                <option value="price-desc">{dict.pages.products.sortPriceDesc ?? 'Price: High to Low'}</option>
                <option value="name-asc">{dict.pages.products.sortNameAsc ?? 'Name: A to Z'}</option>
                <option value="name-desc">{dict.pages.products.sortNameDesc ?? 'Name: Z to A'}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button className="h-11 rounded-2xl px-5 bg-cyan-600 text-white hover:opacity-90 transition">
              {dict.pages.products.apply}
            </button>
            <a
              href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`}
              className="h-11 rounded-2xl px-4 border hover:bg-gray-50 transition inline-flex items-center"
            >
              {dict.pages.products.clear}
            </a>
          </div>
        </form>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        {slice.map((p: ProductWithRelations) => (
          <ProductCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            priceCents={p.variants[0]?.priceCents ?? p.priceCents}
            currency={p.currency}
            imageSrc={(Array.isArray(p.images) && (p.images as { src: string }[])[0]?.src) || undefined}
            inStock={p.inventory?.inStock}
            lowStockAt={p.inventory?.lowStockAt}
            productId={p.id}
            initialFavCount={favCountById.get(p.id) ?? 0}
            initialLikeCount={likeCountById.get(p.id) ?? 0}
            initiallyFavorited={userFavSet.has(p.id)}
            initialLiked={userLikeSet.has(p.id)}
          />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <PageLinkCursor disabled={!cursor} q={q} category={category} inStock={inStock ? '1' : '0'} min={Number.isFinite(min) ? min : undefined} max={Number.isFinite(max) ? max : undefined} sort={sort as any} cursor={prevCursor} dir={'back'} brand={brand} brands={brandsSelected} categories={categoriesSelected} lang={lang}>
          {dict.pages.products.prev}
        </PageLinkCursor>
        <span className="text-sm text-gray-600">
          {slice.length} {dict.pages.products.shown}
        </span>
        <PageLinkCursor disabled={!nextCursor} q={q} category={category} inStock={inStock ? '1' : '0'} min={Number.isFinite(min) ? min : undefined} max={Number.isFinite(max) ? max : undefined} sort={sort as any} cursor={nextCursor} dir={'forward'} brand={brand} brands={brandsSelected} categories={categoriesSelected} lang={lang}>
          {dict.pages.products.next}
        </PageLinkCursor>
      </div>
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