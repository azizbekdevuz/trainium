import { MultiSelect } from '../../components/ui/forms/MultiSelect';
import { getCategoryDisplayName } from '../../lib/product/category-utils';
import type { Dictionary } from '../../lib/i18n/i18n';
import type { Category } from '@prisma/client';
import type { ParsedSearchParams } from './types';

interface ProductFiltersProps {
  lang: string;
  dict: Dictionary;
  categories: Category[];
  brands: { brand: string | null }[];
  currencyOptions: string[];
  params: ParsedSearchParams;
}

export function ProductFilters({
  lang,
  dict,
  categories,
  brands,
  currencyOptions,
  params,
}: ProductFiltersProps) {
  return (
    <form className="glass rounded-2xl p-4 lg:sticky lg:top-16 lg:z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.searchLabel ?? 'Search'}</span>
          <input
            aria-label={dict.pages.products.searchAria ?? 'Search products'}
            name="q"
            defaultValue={params.q}
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
            defaultSelected={params.categoriesSelected}
          />
        </div>

        {brands.length > 0 && (
          <div className="lg:col-span-2">
            <MultiSelect
              name="brands"
              label={dict.pages.products.brands ?? 'Brands'}
              options={brands.map((b) => ({ value: b.brand ?? '', label: b.brand ?? '' }))}
              defaultSelected={params.brandsSelected}
            />
          </div>
        )}

        {currencyOptions.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.currency ?? 'Currency'}</span>
            <select
              aria-label={dict.pages.products.currencyAria ?? 'Currency filter'}
              name="currency"
              defaultValue={params.currency}
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
            defaultValue={params.inStock ? '1' : '0'}
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
            defaultValue={params.withVar ? '1' : '0'}
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
            defaultValue={Number.isFinite(params.min) ? String(params.min) : ''}
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
            defaultValue={Number.isFinite(params.max) ? String(params.max) : ''}
            placeholder={dict.pages.products.maxPh ?? '5000000'}
            className="h-11 w-full rounded-xl border px-3"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">{dict.pages.products.sortBy ?? 'Sort by'}</span>
          <select
            aria-label={dict.pages.products.sortAria ?? 'Sort order'}
            name="sort"
            defaultValue={params.sort}
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
  );
}

