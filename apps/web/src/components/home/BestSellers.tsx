import { cache } from "react";
import { prisma } from "../../lib/database/db";
import { ProductCard } from "../product/ProductCard";
import { ProductWithRelations } from "../../types/prisma";
import { getDictionary, negotiateLocale } from "../../lib/i18n/i18n";
import { auth } from "../../auth";
import { Prisma } from "@prisma/client";

export type BestSellersVariant = "default" | "heroPanel" | "rail";

const loadBestSellersData = cache(async () => {
  const [lang, session, products] = await Promise.all([
    negotiateLocale(),
    auth(),
    prisma.product.findMany({
      where: { active: true, inventory: { is: { inStock: { gt: 0 } } } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        categories: true,
        variants: { take: 1, orderBy: { priceCents: "asc" } },
        inventory: true,
      },
    }),
  ]);
  const dict = await getDictionary(lang);
  if (!products.length) {
    return { lang, dict, products: [] as ProductWithRelations[], maps: null };
  }
  const ids = products.map((p: ProductWithRelations) => p.id);
  const [favCounts, likeCounts, userFavs, userLikes] = await Promise.all([
    prisma.$queryRaw<{ productId: string; count: number }[]>`
      SELECT "productId", COUNT(*)::int AS count FROM "Favorite" WHERE "productId" IN (${Prisma.join(ids)}) GROUP BY "productId"`,
    prisma.$queryRaw<{ productId: string; count: number }[]>`
      SELECT "productId", COUNT(*)::int AS count FROM "ProductLike" WHERE "productId" IN (${Prisma.join(ids)}) GROUP BY "productId"`,
    session?.user?.id
      ? prisma.$queryRaw<{ productId: string }[]>`
          SELECT "productId" FROM "Favorite" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(ids)})`
      : Promise.resolve([] as { productId: string }[]),
    session?.user?.id
      ? prisma.$queryRaw<{ productId: string }[]>`
          SELECT "productId" FROM "ProductLike" WHERE "userId" = ${session.user.id} AND "productId" IN (${Prisma.join(ids)})`
      : Promise.resolve([] as { productId: string }[]),
  ]);
  const favCountById = new Map(favCounts.map((r) => [r.productId, r.count]));
  const likeCountById = new Map(likeCounts.map((r) => [r.productId, r.count]));
  const userFavSet = new Set(userFavs.map((r) => r.productId));
  const userLikeSet = new Set(userLikes.map((r) => r.productId));
  return {
    lang,
    dict,
    products: products as ProductWithRelations[],
    maps: { favCountById, likeCountById, userFavSet, userLikeSet },
  };
});

export default async function BestSellers({
  variant = "default",
}: {
  variant?: BestSellersVariant;
}) {
  const { dict, products, maps } = await loadBestSellersData();
  if (!products.length || !maps) return null;

  const { favCountById, likeCountById, userFavSet, userLikeSet } = maps;

  const cards = products.map((p: ProductWithRelations) => (
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
      compact={variant === "heroPanel"}
    />
  ));

  if (variant === "heroPanel") {
    return (
      <>
        <div className="relative z-[1] flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ui-muted">
            {dict.home.bestSellers.title}
          </h2>
        </div>
        <div className="relative z-[1] grid flex-1 grid-cols-2 gap-2 sm:gap-2.5">{cards}</div>
      </>
    );
  }

  if (variant === "rail") {
    return (
      <section className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6">
        <h2 className="font-display mb-4 text-2xl" style={{ color: "var(--text-primary)" }}>
          {dict.home.bestSellers.title}
        </h2>
        <div className="scroll-thin flex gap-3 overflow-x-auto pb-2 sm:gap-4">
          {products.map((p: ProductWithRelations) => (
            <div key={p.id} className="w-[min(280px,78vw)] flex-shrink-0">
              <ProductCard
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
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ui-primary">
          {dict.home.bestSellers.title}
        </h2>
      </div>
      <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">{cards}</div>
    </section>
  );
}
