import Link from 'next/link';

export type ProductBreadcrumbCategory = { slug: string; label: string };

type ProductDetailBreadcrumbProps = {
  lang: string;
  /** e.g. "Shop" / "Products" */
  productsLabel: string;
  categories: ProductBreadcrumbCategory[];
  productName: string;
};

/** WAI-ARIA breadcrumb pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ */
export function ProductDetailBreadcrumb({
  lang,
  productsLabel,
  categories,
  productName,
}: ProductDetailBreadcrumbProps) {
  const categoryQuery =
    categories.length > 0
      ? categories.map((c) => `categories=${encodeURIComponent(c.slug)}`).join('&')
      : '';
  const categoryHref = categoryQuery ? `/${lang}/products?${categoryQuery}` : null;
  const categoryTitle = categories.map((c) => c.label).join(' · ');

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-ui-muted sm:gap-x-2 sm:text-xs">
        <li className="inline-flex min-w-0 items-center">
          <Link
            href={`/${lang}/products`}
            className="truncate rounded-md px-1 py-0.5 font-medium transition hover:bg-ui-inset hover:text-cyan-700 dark:hover:text-cyan-300"
          >
            {productsLabel}
          </Link>
        </li>
        {categoryHref ? (
          <li className="inline-flex min-w-0 max-w-full items-center gap-1.5 sm:gap-2">
            <span className="text-ui-faint select-none" aria-hidden>
              /
            </span>
            <Link
              href={categoryHref}
              className="truncate rounded-md px-1 py-0.5 font-medium transition hover:bg-ui-inset hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              {categoryTitle}
            </Link>
          </li>
        ) : null}
        <li className="inline-flex min-w-0 max-w-full items-center gap-1.5 sm:gap-2">
          <span className="text-ui-faint select-none" aria-hidden>
            /
          </span>
          <span
            className="truncate font-semibold text-ui-primary"
            aria-current="page"
          >
            {productName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
