import { addToCartAction } from '../../actions/cart';
import QtyAndAdd from '../../../components/product/QtyAndAdd';
import { prisma } from '../../../lib/database/db';
import { notFound } from 'next/navigation';
import { formatCurrency } from '../../../lib/utils/format';
import { getStockBadgeConfig } from '../../../lib/product/inventory-utils';
import SmartImage from '../../../components/ui/media/SmartImage';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';
import { getCategoryDisplayName } from '../../../lib/product/category-utils';
import { Icon } from '../../../components/ui/media/Icon';
import { auth } from '../../../auth';
import { FavoriteButton } from '../../../components/product/FavoriteButton';
import { ProductLikeButton } from '../../../components/product/LikeButton';
import { ReviewsSection } from '../../../components/product/ReviewsSection';
import { ProductCard } from '../../../components/product/ProductCard';
import { ReviewForm } from '../../../components/product/ReviewForm';
import { RecommendedProducts } from '../../../components/recommendations/RecommendedProducts';

type Props = {
    params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function ProductPage({ params }: Props) {
    const lang = await negotiateLocale();
    const dict = await getDictionary(lang);
    const { slug } = await params;

    const product = await prisma.product.findUnique({
        where: { slug },
        include: { variants: true, categories: true, inventory: true },
      });

    if (!product || !product.active) return notFound();

    const primaryImage =
        (Array.isArray(product.images) && (product.images as { src: string }[])[0]?.src) || '';

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

    function StockInfo({ inStock, lowStockAt }: { inStock: number; lowStockAt?: number | null }) {
        if (inStock === 0) {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <div className="text-sm font-medium text-red-600">{dict.product?.stock?.outOfStock ?? 'Out of Stock'}</div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            );
        }
        
        if (lowStockAt !== null && lowStockAt !== undefined && inStock <= lowStockAt) {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <div className="text-sm font-medium text-orange-600">{(dict.product?.stock?.onlyLeft ?? 'Only {{0}} left in stock').replace('{{0}}', String(inStock))}</div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
            );
        }
        
                return (
            <div className="mt-1 text-xs text-gray-500">
                {(dict.product?.stock?.inStock ?? '{{0}} in stock').replace('{{0}}', String(inStock))}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="grid gap-10 md:grid-cols-2">
                <div className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-slate-800 overflow-hidden relative">
                    {primaryImage ? (
                        <SmartImage src={primaryImage} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    ) : (
                        <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
                            Image coming soon
                        </div>
                    )}
                    {/* Favorite overlay moved away from stock badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {/* Keep some space under badges; move icon to left side of image footer */}
                    </div>
                    
                    {/* Stock Status Badge */}
                    {badgeConfig.show && (
                        <div className="absolute top-4 right-4">
                            <div className={badgeConfig.className}>
                                {badgeConfig.text === 'lowStock' 
                                  ? (dict.product?.badges?.lowStock ?? 'Low Stock').replace('{{0}}', String(product.inventory?.inStock ?? 0))
                                  : badgeConfig.text === 'outOfStock' 
                                  ? (dict.product?.badges?.outOfStock ?? 'Out of Stock') 
                                  : ''}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="font-display text-3xl">{product.name}</h1>
                    <div className="mt-2 text-gray-500 dark:text-slate-400 text-sm">
                        {product.categories.map((c) => getCategoryDisplayName(c, dict)).join(' · ')}
                    </div>

                    <div className="mt-4">
                        <PriceBlock
                            priceCents={product.variants[0]?.priceCents ?? product.priceCents}
                            currency={product.currency}
                        />
                        <StockInfo 
                            inStock={product.inventory?.inStock ?? 0}
                            lowStockAt={product.inventory?.lowStockAt}
                        />
                    </div>

                    {product.summary && <p className="mt-6 text-gray-700 dark:text-slate-200">{product.summary}</p>}
                    {product.description && (
                        <p className="mt-3 text-gray-600 dark:text-slate-300 text-sm leading-relaxed">{product.description}</p>
                    )}

                    <div className="mt-6 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                        <div>{dict.product?.stock?.shipping ?? 'Shipping: 2–4 business days (KR)'}</div>
                        <div>{dict.product?.stock?.returns ?? 'Returns: 14-day change-of-mind'}</div>
                        <div>{dict.product?.stock?.warranty ?? 'Warranty: 1 year limited warranty'}</div>
                    </div>

                    {/* Add to cart */}
                    <form className="mt-6 space-y-3" action={addToCartAction} id="add-to-cart-form">
                        <input type="hidden" name="productId" value={product.id} />
                        {product.variants.length > 0 ? (
                            <label className="block text-sm text-gray-600 dark:text-slate-300">
                                Variant
                                <select
                                    name="variantId"
                                    defaultValue={firstVariant?.id}
                                    className="mt-1 h-10 w-full rounded-xl border px-3"
                                >
                                    {product.variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} — {formatCurrency(v.priceCents, product.currency)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : (
                            <input type="hidden" name="variantId" value="" />
                        )}

                        <div className="flex items-center gap-3">
                            <QtyAndAdd available={product.inventory?.inStock ?? 0} />
                            <div className="flex items-center gap-2">
                                <FavoriteButton productId={product.id} initiallyFavorited={initiallyFavorited} initialCount={favCount} showCount={true} />
                                <ProductLikeButton productId={product.id} initialLiked={initialLiked} initialCount={likeCount} showCount={true} />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            {/* Reviews & Related */}
            <div className="mt-12 grid gap-10">
                <ReviewForm productId={product.id} />
                <ReviewsSection productId={product.id} />
                {relatedProducts.length > 0 && (
                    <section>
                        <h3 className="font-display text-2xl mb-4">{dict.product?.sections?.related ?? 'Related products'}</h3>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                            {relatedProducts.slice(0,5).map((p) => (
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
                            <div className="mt-4 text-right">
                                <details>
                                    <summary className="cursor-pointer text-sm text-cyan-700 hover:underline">{dict.common?.showAll ?? 'Show all'}</summary>
                                    <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
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
                            </div>
                        )}
                    </section>
                )}

                {seeMoreProducts.length > 0 && (
                    <section>
                        <h3 className="font-display text-2xl mb-4">{dict.product?.sections?.seeMore ?? 'See more products'}</h3>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
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
                        <div className="mt-4 text-right">
                            <a href={`/${lang}/products?brand=${encodeURIComponent(product.brand ?? '')}`} className="text-sm text-cyan-700 hover:underline">
                                {dict.pages?.products?.learnMore ?? 'Learn more'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
                            </a>
                        </div>
                    </section>
                )}

                {/* Recommendations Section */}
                <RecommendedProducts
                    context="product"
                    currentProductId={product.id}
                    initialLimit={5}
                    showTitle={true}
                />
            </div>
        </div>
    );
}

function PriceBlock({ priceCents, currency }: { priceCents: number; currency: string }) {
    return (
        <div className="text-2xl font-semibold text-cyan-700">
            {formatCurrency(priceCents, currency)}
        </div>
    );
}


// no client code below