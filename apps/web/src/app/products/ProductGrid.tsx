import { ProductCard } from '../../components/product/ProductCard';
import { ProductWithRelations } from '../../types/prisma';
import { getCategoryDisplayName } from '../../lib/product/category-utils';
import type { Dictionary } from '../../lib/i18n/i18n';

interface ProductGridProps {
  products: ProductWithRelations[];
  favCountById: Map<string, number>;
  likeCountById: Map<string, number>;
  userFavSet: Set<string>;
  userLikeSet: Set<string>;
  dict: Dictionary;
}

export function ProductGrid({
  products,
  favCountById,
  likeCountById,
  userFavSet,
  userLikeSet,
  dict,
}: ProductGridProps) {
  return (
    <div className="mt-4 grid grid-cols-2 items-stretch gap-2.5 sm:mt-5 sm:gap-3 md:grid-cols-3 md:gap-3 lg:gap-3.5 xl:grid-cols-4 xl:gap-3.5 2xl:grid-cols-5 [&>*]:min-w-0">
      {products.map((p: ProductWithRelations) => {
        const primaryCategory = p.categories[0];
        const categoryLabel = primaryCategory ? getCategoryDisplayName(primaryCategory, dict) : undefined;
        return (
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
          categoryLabel={categoryLabel}
          listing
        />
        );
      })}
    </div>
  );
}

