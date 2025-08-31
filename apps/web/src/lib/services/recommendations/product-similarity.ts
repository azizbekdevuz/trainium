import { prisma } from '../../db';
import { RecommendedProduct } from './types';

export class ProductSimilarityService {
  /**
   * Find similar products based on categories and brand
   */
  static async findSimilarProducts(
    productIds: string[],
    excludeIds: string[] = [],
    limit: number = 10
  ): Promise<RecommendedProduct[]> {
    if (productIds.length === 0) return [];

    try {
      // Get categories and brands from source products
      const sourceProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          categories: true,
          inventory: true,
          favorites: true,
          productLikes: true
        }
      });

      const sourceCategories = sourceProducts.flatMap(p => p.categories.map(c => c.slug));
      const sourceBrands = sourceProducts.map(p => p.brand).filter(Boolean);

      // Find products with similar categories or brands
      const similarProducts = await prisma.product.findMany({
        where: {
          AND: [
            { active: true },
            { id: { notIn: [...productIds, ...excludeIds] } },
            { inventory: { is: { inStock: { gt: 0 } } } },
            {
              OR: [
                { categories: { some: { slug: { in: sourceCategories } } } },
                ...(sourceBrands.length > 0 ? [{ brand: { in: sourceBrands } }] : [])
              ]
            }
          ]
        },
        include: {
          categories: true,
          inventory: true,
          favorites: true,
          productLikes: true,
          variants: {
            take: 1,
            orderBy: { priceCents: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2 // Get more to filter and sort
      });

      // Score and sort products by similarity
      const scoredProducts = similarProducts.map(product => ({
        product,
        score: this.calculateSimilarityScore(product, sourceCategories, sourceBrands)
      }));

      // Sort by score and take top results
      const topProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => this.mapToRecommendedProduct(item.product, []));

      return topProducts;
    } catch (error) {
      console.error('Error finding similar products:', error);
      return [];
    }
  }

  private static calculateSimilarityScore(
    product: any,
    sourceCategories: string[],
    sourceBrands: string[]
  ): number {
    let score = 0;

    // Category similarity (higher weight)
    const productCategories = product.categories.map((c: any) => c.slug);
    const categoryMatches = productCategories.filter((cat: string) => 
      sourceCategories.includes(cat)
    ).length;
    score += categoryMatches * 3;

    // Brand similarity (medium weight)
    if (product.brand && sourceBrands.includes(product.brand)) {
      score += 2;
    }

    // Recency bonus (newer products get slight boost)
    const daysSinceCreated = (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score += 1;
    }

    // Popularity bonus (more favorites/likes)
    score += Math.min(product.favorites.length * 0.1, 1);
    score += Math.min(product.productLikes.length * 0.1, 1);

    return score;
  }

  private static mapToRecommendedProduct(product: any, userFavorites: string[]): RecommendedProduct {
    const primaryImage = Array.isArray(product.images) && product.images[0]?.src 
      ? product.images[0].src 
      : undefined;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.variants[0]?.priceCents ?? product.priceCents,
      currency: product.currency,
      imageSrc: primaryImage,
      inStock: product.inventory?.inStock ?? 0,
      lowStockAt: product.inventory?.lowStockAt,
      brand: product.brand,
      categories: product.categories.map((c: any) => c.slug),
      favoriteCount: product.favorites.length,
      likeCount: product.productLikes.length,
      isFavorited: userFavorites.includes(product.id),
      isLiked: false // Will be set by the calling service
    };
  }

  /**
   * Get products by categories
   */
  static async getProductsByCategories(
    categories: string[],
    excludeIds: string[] = [],
    limit: number = 10
  ): Promise<RecommendedProduct[]> {
    if (categories.length === 0) return [];

    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { active: true },
            { id: { notIn: excludeIds } },
            { inventory: { is: { inStock: { gt: 0 } } } },
            { categories: { some: { slug: { in: categories } } } }
          ]
        },
        include: {
          categories: true,
          inventory: true,
          favorites: true,
          productLikes: true,
          variants: {
            take: 1,
            orderBy: { priceCents: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return products.map(product => this.mapToRecommendedProduct(product, []));
    } catch (error) {
      console.error('Error getting products by categories:', error);
      return [];
    }
  }
}
