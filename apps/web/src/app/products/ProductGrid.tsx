import { ProductCard } from '../../components/product/ProductCard';
import { ProductWithRelations } from '../../types/prisma';

interface ProductGridProps {
  products: ProductWithRelations[];
  favCountById: Map<string, number>;
  likeCountById: Map<string, number>;
  userFavSet: Set<string>;
  userLikeSet: Set<string>;
}

export function ProductGrid({
  products,
  favCountById,
  likeCountById,
  userFavSet,
  userLikeSet,
}: ProductGridProps) {
  return (
    <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
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
  );
}

