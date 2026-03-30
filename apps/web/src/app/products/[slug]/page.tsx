import { addToCartAction } from '../../actions/cart';
import QtyAndAdd from '../../../components/product/QtyAndAdd';
import { prisma } from '../../../lib/database/db';
import { notFound } from 'next/navigation';
import { formatCurrency } from '../../../lib/utils/format';
import { getStockBadgeConfig } from '../../../lib/product/inventory-utils';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';
import { getCategoryDisplayName } from '../../../lib/product/category-utils';
import { Icon, PackageIcon } from '../../../components/ui/media/Icon';
import { auth } from '../../../auth';
import { FavoriteButton } from '../../../components/product/FavoriteButton';
import { ProductLikeButton } from '../../../components/product/LikeButton';
import { ReviewsSection } from '../../../components/product/ReviewsSection';
import { ProductCard } from '../../../components/product/ProductCard';
import { ReviewForm } from '../../../components/product/ReviewForm';
import { RecommendedProducts } from '../../../components/recommendations/RecommendedProducts';
import { ProductImageGallery } from '../../../components/product/ProductImageGallery';
import { ProductDetailTabs } from '../../../components/product/ProductDetailTabs';
import { BentoPanel } from '../../../components/product/BentoPanel';
import { ProductDetailBreadcrumb } from '../../../components/product/ProductDetailBreadcrumb';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug },
        select: {
            name: true,
            summary: true,
            description: true,
            images: true,
            currency: true,
            priceCents: true,
            updatedAt: true,
        },
    });
    if (!product) return { title: 'Product Not Found | Trainium' };

    const primaryImage = (Array.isArray(product.images) && (product.images as { src: string }[])[0]?.src) || undefined;
    const title = `${product.name} | Trainium`;
    const description =
        product.summary ||
        (typeof product.description === 'string' ? product.description.slice(0, 160) : 'Premium fitness equipment from Trainium.');

    return {
        title,
        description,
        alternates: {
            languages: {
                'en': `https://trainium.shop/en/products/${encodeURIComponent(slug)}`,
                'ko': `https://trainium.shop/ko/products/${encodeURIComponent(slug)}`,
                'uz': `https://trainium.shop/uz/products/${encodeURIComponent(slug)}`,
            },
        },
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://trainium.shop/en/products/${encodeURIComponent(slug)}`,
            images: primaryImage ? [{ url: primaryImage }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: primaryImage ? [primaryImage] : undefined,
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const lang = await negotiateLocale();
    const dict = await getDictionary(lang);
    const { slug } = await params;

    const product = await prisma.product.findUnique({
        where: { slug },
        include: { variants: true, categories: true, inventory: true },
      });

    if (!product || !product.active) return notFound();

    const imageUrls = Array.isArray(product.images)
        ? (product.images as { src?: string }[])
              .map((i) => i?.src)
              .filter((s): s is string => typeof s === 'string' && s.length > 0)
        : [];

    const primaryImage = imageUrls[0] ?? '';

    const firstVariant = product.variants[0];
    const badgeConfig = getStockBadgeConfig(product.inventory?.inStock ?? 0, product.inventory?.lowStockAt);

    // Related and See More queries
    const categoryIds = product.categories.map((c) => c.id);
    const [relatedProducts, seeMoreProducts] = await Promise.all([
        categoryIds.length
            ? prisma.product.findMany({
                where: {
                    active: true,
                    id: { not: product.id },
                    categories: { some: { id: { in: categoryIds } } },
                },
                orderBy: { createdAt: 'desc' },
                take: 6,
                include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
            })
            : Promise.resolve([]),
        prisma.product.findMany({
            where: {
                active: true,
                id: { not: product.id },
                ...(product.brand ? { brand: product.brand } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
        }),
    ]);

    // Aggregate counts and user states using raw to avoid type drift before generate
    const session = await auth();
    const [favRows, likeRows, favMineRows, likeMineRows] = await Promise.all([
        prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "Favorite" WHERE "productId" = ${product.id}`,
        prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "ProductLike" WHERE "productId" = ${product.id}`,
        session?.user?.id ? prisma.$queryRaw<{ exists: boolean }[]>`SELECT EXISTS(SELECT 1 FROM "Favorite" WHERE "userId" = ${session.user.id} AND "productId" = ${product.id}) AS exists` : Promise.resolve([{ exists: false }]),
        session?.user?.id ? prisma.$queryRaw<{ exists: boolean }[]>`SELECT EXISTS(SELECT 1 FROM "ProductLike" WHERE "userId" = ${session.user.id} AND "productId" = ${product.id}) AS exists` : Promise.resolve([{ exists: false }]),
    ]);
    const favCount = favRows[0]?.count ?? 0;
    const likeCount = likeRows[0]?.count ?? 0;
    const initiallyFavorited = !!favMineRows[0]?.exists;
    const initialLiked = !!likeMineRows[0]?.exists;

    // Reviews aggregate for JSON-LD (only include when reviews exist)
    const reviewsAgg = await prisma.review.aggregate({
        where: { productId: product.id, status: 'ACTIVE' as any },
        _avg: { rating: true },
        _count: { _all: true },
    });
    const reviewCount = (reviewsAgg._count as any)?._all ?? 0;
    const avgRating = reviewsAgg._avg?.rating ?? null;

    const productJsonLd: any = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || product.summary || '',
        image: primaryImage ? [primaryImage] : undefined,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        offers: {
            '@type': 'Offer',
            price: (firstVariant?.priceCents ?? product.priceCents) / 100,
            priceCurrency: product.currency,
            availability:
                (product.inventory?.inStock ?? 0) > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            url: `https://trainium.shop/${lang}/products/${encodeURIComponent(product.slug)}`,
        },
    };
    if (reviewCount > 0 && avgRating) {
        productJsonLd.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(avgRating.toFixed(2)),
            reviewCount: reviewCount,
        };
    }

    function StockInfo({ inStock, lowStockAt }: { inStock: number; lowStockAt?: number | null }) {
        if (inStock === 0) {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <div className="text-sm font-medium text-red-600">{dict.product?.stock?.outOfStock ?? 'Out of Stock'}</div>
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
            );
        }

        if (lowStockAt !== null && lowStockAt !== undefined && inStock <= lowStockAt) {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <div className="text-sm font-medium text-orange-600">{(dict.product?.stock?.onlyLeft ?? 'Only {{0}} left in stock').replace('{{0}}', String(inStock))}</div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                </div>
            );
        }

                return (
            <div className="mt-1 text-xs text-ui-faint">
                {(dict.product?.stock?.inStock ?? '{{0}} in stock').replace('{{0}}', String(inStock))}
            </div>
        );
    }

    const breadcrumbCategories = product.categories.map((c) => ({
        slug: c.slug,
        label: getCategoryDisplayName(c, dict),
    }));

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: dict.pages?.products?.title ?? 'Shop',
                item: `https://trainium.shop/${lang}/products`,
            },
            ...(breadcrumbCategories.length > 0
                ? [
                      {
                          '@type': 'ListItem',
                          position: 2,
                          name: breadcrumbCategories.map((c) => c.label).join(' · '),
                          item: `https://trainium.shop/${lang}/products?${breadcrumbCategories.map((c) => `categories=${encodeURIComponent(c.slug)}`).join('&')}`,
                      },
                  ]
                : []),
            {
                '@type': 'ListItem',
                position: breadcrumbCategories.length > 0 ? 3 : 2,
                name: product.name,
                item: `https://trainium.shop/${lang}/products/${encodeURIComponent(product.slug)}`,
            },
        ],
    };
    const hasDescription = typeof product.description === 'string' && product.description.trim().length > 0;
    const hasSummary = typeof product.summary === 'string' && product.summary.trim().length > 0;

    const stockBadge =
        badgeConfig.show ? (
            <div className={badgeConfig.className}>
                {badgeConfig.text === 'lowStock'
                  ? (dict.product?.badges?.lowStock ?? 'Low Stock').replace('{{0}}', String(product.inventory?.inStock ?? 0))
                  : badgeConfig.text === 'outOfStock'
                  ? (dict.product?.badges?.outOfStock ?? 'Out of Stock')
                  : ''}
            </div>
        ) : null;

    const tabLabels = {
        description: dict.product?.tabDescription ?? 'Description',
        summary: dict.product?.tabSummary ?? 'Summary',
        reviews: dict.product?.tabReviews ?? 'Reviews',
        related: dict.product?.tabRelated ?? 'Related & recommended',
    };

    const relatedRecommendedPanel = (
        <div className="space-y-8">
            {relatedProducts.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ui-muted">
                        {dict.product?.sections?.related ?? 'Related products'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                        {relatedProducts.slice(0, 5).map((p) => (
                            <ProductCard
                                key={p.id}
                                slug={p.slug}
                                name={p.name}
                                priceCents={p.variants[0]?.priceCents ?? p.priceCents}
                                currency={p.currency}
                                imageSrc={(Array.isArray(p.images) && (p.images as { src: string }[])[0]?.src) || undefined}
                                inStock={p.inventory?.inStock ?? undefined}
                                lowStockAt={p.inventory?.lowStockAt ?? undefined}
                                productId={p.id}
                            />
                        ))}
                    </div>
                    {relatedProducts.length > 5 && (
                        <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-cyan-700 hover:underline dark:text-cyan-400">
                                {dict.common?.showAll ?? 'Show all'}
                            </summary>
                            <div className="mt-3 grid gap-4 sm:grid-cols-2 items-stretch">
                                {relatedProducts.slice(5).map((p) => (
                                    <ProductCard
                                        key={p.id}
                                        slug={p.slug}
                                        name={p.name}
                                        priceCents={p.variants[0]?.priceCents ?? p.priceCents}
                                        currency={p.currency}
                                        imageSrc={(Array.isArray(p.images) && (p.images as { src: string }[])[0]?.src) || undefined}
                                        inStock={p.inventory?.inStock ?? undefined}
                                        lowStockAt={p.inventory?.lowStockAt ?? undefined}
                                        productId={p.id}
                                    />
                                ))}
                            </div>
                        </details>
                    )}
                </section>
            )}

            {seeMoreProducts.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ui-muted">
                        {dict.product?.sections?.seeMore ?? 'See more products'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                        {seeMoreProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                slug={p.slug}
                                name={p.name}
                                priceCents={p.variants[0]?.priceCents ?? p.priceCents}
                                currency={p.currency}
                                imageSrc={(Array.isArray(p.images) && (p.images as { src: string }[])[0]?.src) || undefined}
                                inStock={p.inventory?.inStock ?? undefined}
                                lowStockAt={p.inventory?.lowStockAt ?? undefined}
                                productId={p.id}
                            />
                        ))}
                    </div>
                    <div className="mt-3">
                        <a
                            href={`/${lang}/products?brand=${encodeURIComponent(product.brand ?? '')}`}
                            className="text-sm text-cyan-700 hover:underline dark:text-cyan-400"
                        >
                            {dict.pages?.products?.learnMore ?? 'Learn more'}{' '}
                            <Icon name="arrowRight" className="ml-1 inline h-3 w-3" />
                        </a>
                    </div>
                </section>
            )}

            <RecommendedProducts
                context="product"
                currentProductId={product.id}
                initialLimit={5}
                showTitle={true}
                embedded
            />
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <script type="application/ld+json" suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
            <script type="application/ld+json" suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
                <div className="min-w-0 max-w-full overflow-x-clip lg:flex lg:justify-center">
                    <div className="w-full min-w-0 max-w-xl lg:max-w-none">
                        <ProductDetailBreadcrumb
                            lang={lang}
                            productsLabel={dict.pages?.products?.title ?? 'Shop'}
                            categories={breadcrumbCategories}
                            productName={product.name}
                        />
                        <ProductImageGallery images={imageUrls} alt={product.name} badge={stockBadge} />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                    <BentoPanel>
                        <h1 className="font-display text-2xl sm:text-3xl">{product.name}</h1>
                        {reviewCount > 0 && avgRating != null ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ui-secondary">
                                <span className="text-amber-500" aria-hidden>
                                    {'★'.repeat(Math.min(5, Math.round(avgRating)))}
                                    {'☆'.repeat(Math.max(0, 5 - Math.round(avgRating)))}
                                </span>
                                <span>
                                    {avgRating.toFixed(1)} — {reviewCount} {dict.reviews?.title ?? 'Reviews'}
                                </span>
                            </div>
                        ) : null}
                        <div className="mt-4">
                            <PriceBlock
                                priceCents={product.variants[0]?.priceCents ?? product.priceCents}
                                currency={product.currency}
                            />
                        </div>
                    </BentoPanel>

                    <BentoPanel>
                        <StockInfo
                            inStock={product.inventory?.inStock ?? 0}
                            lowStockAt={product.inventory?.lowStockAt}
                        />
                        <form className="mt-4 space-y-4" action={addToCartAction} id="add-to-cart-form">
                            <input type="hidden" name="productId" value={product.id} />
                            {product.variants.length > 0 ? (
                                <fieldset>
                                    <legend className="text-sm font-medium text-ui-muted dark:text-ui-faint">
                                        Variant
                                    </legend>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {product.variants.map((v) => (
                                            <label
                                                key={v.id}
                                                className="cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name="variantId"
                                                    value={v.id}
                                                    defaultChecked={v.id === firstVariant?.id}
                                                    className="peer sr-only"
                                                />
                                                <span className="inline-flex flex-wrap items-baseline gap-x-1.5 rounded-full border border-ui-subtle px-3 py-2 text-sm transition peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-800 dark:peer-checked:text-cyan-200">
                                                    <span className="font-medium">{v.name}</span>
                                                    <span className="text-ui-muted dark:text-ui-faint">
                                                        {formatCurrency(v.priceCents, product.currency)}
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            ) : (
                                <input type="hidden" name="variantId" value="" />
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                <QtyAndAdd available={product.inventory?.inStock ?? 0} />
                                <div className="flex items-center gap-2">
                                    <FavoriteButton productId={product.id} initiallyFavorited={initiallyFavorited} initialCount={favCount} showCount={true} />
                                    <ProductLikeButton productId={product.id} initialLiked={initialLiked} initialCount={likeCount} showCount={true} />
                                </div>
                            </div>
                        </form>
                    </BentoPanel>

                    <BentoPanel className="min-h-0">
                        <ProductDetailTabs
                            labels={tabLabels}
                            hasDescription={hasDescription}
                            hasSummary={hasSummary}
                            showRelatedTab={true}
                            relatedPanel={relatedRecommendedPanel}
                            descriptionPanel={
                                <div className="text-sm leading-relaxed text-ui-secondary dark:text-ui-muted">
                                    {hasDescription ? (
                                        <p className="whitespace-pre-wrap">{product.description}</p>
                                    ) : (
                                        <p className="text-ui-faint">{dict.product?.noDescription ?? 'No detailed description for this product yet.'}</p>
                                    )}
                                </div>
                            }
                            summaryPanel={
                                <div className="text-sm leading-relaxed text-ui-secondary dark:text-ui-muted">
                                    {hasSummary ? (
                                        <p className="whitespace-pre-wrap">{product.summary}</p>
                                    ) : (
                                        <p className="text-ui-faint">{dict.product?.noSummary ?? 'No summary available.'}</p>
                                    )}
                                </div>
                            }
                            reviewsPanel={
                                <div className="space-y-6">
                                    <ReviewForm productId={product.id} />
                                    <ReviewsSection productId={product.id} className="mt-0" />
                                </div>
                            }
                        />
                    </BentoPanel>

                    <BentoPanel>
                        <ul className="space-y-3 text-sm text-ui-secondary dark:text-ui-muted">
                            <li className="flex gap-3">
                                <PackageIcon className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" size={20} />
                                <span>{dict.product?.stock?.shipping ?? 'Shipping: 2–4 business days (KR)'}</span>
                            </li>
                            <li className="flex gap-3">
                                <Icon name="arrowRight" className="mt-0.5 shrink-0 rotate-180 text-cyan-600 dark:text-cyan-400" size={20} />
                                <span>{dict.product?.stock?.returns ?? 'Returns: 14-day change-of-mind'}</span>
                            </li>
                            <li className="flex gap-3">
                                <Icon name="success" className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" size={20} />
                                <span>{dict.product?.stock?.warranty ?? 'Warranty: 1 year limited warranty'}</span>
                            </li>
                        </ul>
                    </BentoPanel>
                </div>
            </div>
        </div>
    );
}

function PriceBlock({ priceCents, currency }: { priceCents: number; currency: string }) {
    return (
        <div className="text-2xl font-semibold text-cyan-700 dark:text-cyan-300">
            {formatCurrency(priceCents, currency)}
        </div>
    );
}
