import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';
import { auth } from '../../auth';
import { normalizeMulti } from './filters';
import { getProductsPageData, getProductInteractionData } from './data';
import { MerchandisingZones } from './MerchandisingZones';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from './ProductGrid';
import { ProductPagination } from './ProductPagination';
import type { SearchParams, ParsedSearchParams } from './types';
import type { Metadata } from 'next';

type Props = {
  searchParams?: Promise<SearchParams>;
};

export const revalidate = 60; // ISR every 60s

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? '').trim();
  const category = (sp.category ?? '').trim();
  const brand = (sp.brand ?? '').trim();

  const parts: string[] = [];
  if (q) parts.push(`Search: ${q}`);
  if (category) parts.push(`Category: ${category}`);
  if (brand) parts.push(`Brand: ${brand}`);
  const suffix = parts.length ? ` – ${parts.join(' · ')}` : '';

  const title = `Shop Fitness Equipment${suffix} | Trainium`;
  const description =
    q || category || brand
      ? `Browse Trainium products${q ? ` for "${q}"` : ''}${category ? ` in ${category}` : ''}${brand ? ` by ${brand}` : ''}.`
      : 'Browse premium fitness equipment at Trainium: treadmills, dumbbells, bikes, strength & cardio.';

  return {
    title,
    description,
    alternates: {
      languages: {
        'en': 'https://trainium.shop/en/products',
        'ko': 'https://trainium.shop/ko/products',
        'uz': 'https://trainium.shop/uz/products',
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://trainium.shop/en/products',
    },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const session = await auth();
  const sp = (await searchParams) ?? {};
  
  const category = (sp.category ?? '').trim();
  const brand = (sp.brand ?? '').trim();
  const categoriesSelected = (() => {
    const selected = normalizeMulti((sp as any).categories);
    return selected.length === 0 && category ? [category] : selected;
  })();
  const brandsSelected = (() => {
    const selected = normalizeMulti((sp as any).brands);
    return selected.length === 0 && brand ? [brand] : selected;
  })();

  const params: ParsedSearchParams = {
    q: (sp.q ?? '').trim(),
    category,
    min: Number(sp.min ?? '0'),
    max: Number(sp.max ?? '50000000'),
    sort: (sp.sort ?? 'new') as NonNullable<SearchParams['sort']>,
    inStock: (sp.inStock ?? '1') === '1',
    cursor: (sp.cursor ?? '').trim(),
    dir: (sp.dir ?? 'forward') as 'forward' | 'back',
    brand,
    currency: (sp.currency ?? '').trim(),
    withVar: (sp.withVar ?? '0') === '1',
    categoriesSelected,
    brandsSelected,
  };

  const { categories, products, brands, currencyOptions, nextCursor, prevCursor } = await getProductsPageData(params, dict);
  
  const visibleIds = products.map((p) => p.id);
  const { favCountById, likeCountById, userFavSet, userLikeSet } = await getProductInteractionData(
    visibleIds,
    session?.user?.id
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      {/* JSON-LD ItemList for visible products */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: products.map((p, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `https://trainium.shop/${lang}/products/${encodeURIComponent(p.slug)}`,
            })),
          }),
        }}
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <h2 className="font-display text-3xl">{dict.pages.products.title}</h2>
          <p className="text-gray-600">{dict.pages.products.subtitle}</p>
        </div>

        <MerchandisingZones lang={lang} dict={dict} />

        <ProductFilters
          lang={lang}
          dict={dict}
          categories={categories}
          brands={brands}
          currencyOptions={currencyOptions}
          params={params}
        />
      </div>

      <ProductGrid
        products={products}
        favCountById={favCountById}
        likeCountById={likeCountById}
        userFavSet={userFavSet}
        userLikeSet={userLikeSet}
      />

      <ProductPagination
        lang={lang}
        dict={dict}
        params={params}
        nextCursor={nextCursor}
        prevCursor={prevCursor}
        productCount={products.length}
      />
    </div>
  );
}
