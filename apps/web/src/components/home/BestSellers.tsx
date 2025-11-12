import { prisma } from '../../lib/database/db';
import { ProductCard } from '../product/ProductCard';
import { ProductWithRelations } from '../../types/prisma';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';
import { auth } from '../../auth';
import { Prisma } from '@prisma/client';

export default async function BestSellers() {
    const [lang, session, products] = await Promise.all([
        negotiateLocale(),
        auth(),
        prisma.product.findMany({
        where: { active: true, inventory: { is: { inStock: { gt: 0 } } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
            include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
        })
    ]);
    const dict = await getDictionary(lang);

    if (!products.length) return null;

    const ids = products.map((p: ProductWithRelations) => p.id);
    const [favCounts, likeCounts, userFavs, userLikes] = await Promise.all([
        prisma.$queryRaw<{ productId: string; count: number }[]>`SELECT "productId", COUNT(*)::int AS count FROM "Favorite" WHERE "productId" IN (${Prisma.join(ids)}) GROUP BY "productId"`,
        prisma.$queryRaw<{ productId: string; count: number }[]>`SELECT "productId", COUNT(*)::int AS count FROM "ProductLike" WHERE "productId" IN (${Prisma.join(ids)}) GROUP BY "productId"`,
        session?.user?.id ? prisma.$queryRaw<{ productId: string }[]>`SELECT "productId" FROM "Favorite" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(ids)})` : Promise.resolve([] as { productId: string }[]),
        session?.user?.id ? prisma.$queryRaw<{ productId: string }[]>`SELECT "productId" FROM "ProductLike" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(ids)})` : Promise.resolve([] as { productId: string }[]),
    ]);
    const favCountById = new Map(favCounts.map((r) => [r.productId, r.count]));
    const likeCountById = new Map(likeCounts.map((r) => [r.productId, r.count]));
    const userFavSet = new Set(userFavs.map((r) => r.productId));
    const userLikeSet = new Set(userLikes.map((r) => r.productId));

    return (
        <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl">{dict.home.bestSellers.title}</h2>
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                {products.map((p: ProductWithRelations) => (
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
        </section>
    );
}