import { UserActivityService } from './user-activity-service';
import { ProductSimilarityService } from './product-similarity';
import { prisma } from '../../database/db';
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  RecommendedProduct, 
  RecommendationSource,
  UserActivityData 
} from './types';

export class RecommendationEngine {
  private static readonly CONFIG = {
    maxRecommendations: 50,
    cacheDuration: 3600, // 1 hour
    fallbackLimit: 10,
    similarityThreshold: 0.1
  };

  /**
   * Generate general recommendations for unauthenticated users
   */
  static async getGeneralRecommendations(
    context: 'product' | 'home' | 'cart',
    currentProductId?: string,
    limit: number = 5,
    offset: number = 0
  ): Promise<RecommendationResponse> {
    try {
      const excludeIds = [currentProductId].filter(Boolean) as string[];
      
      // For unauthenticated users, show a mix of popular and newest products
      const [popularProducts, newestProducts] = await Promise.all([
        this.getPopularProducts(excludeIds, Math.ceil(limit / 2)),
        this.getNewestProducts(excludeIds, Math.floor(limit / 2))
      ]);

      // Combine and deduplicate
      const allProducts = [...popularProducts, ...newestProducts];
      const uniqueProducts = this.deduplicateProducts(allProducts);
      
      const limitedProducts = uniqueProducts.slice(offset, offset + limit);
      
      return {
        products: limitedProducts,
        hasMore: uniqueProducts.length > offset + limit,
        total: uniqueProducts.length,
        source: 'fallback',
        fallbackUsed: true
      };

    } catch (error) {
      console.error('Error getting general recommendations:', error);
      return {
        products: [],
        hasMore: false,
        total: 0,
        source: 'fallback',
        fallbackUsed: true
      };
    }
  }

  /**
   * Generate recommendations for a user
   */
  static async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    try {
      // Check if user has activity data
      const hasActivity = await UserActivityService.hasUserActivity(request.userId);
      
      if (!hasActivity) {
        return await this.getFallbackRecommendations(request);
      }

      // Get user activity data
      const userActivity = await UserActivityService.getUserActivityData(request.userId);
      
      // Generate recommendations based on priority: Favorites > Likes > Purchases
      let recommendations: RecommendedProduct[] = [];
      let source: RecommendationSource = 'fallback';

      const limit = request.limit || 5;
      
      // Try favorites first
      if (userActivity.favoriteProductIds.length > 0) {
        recommendations = await this.getRecommendationsFromFavorites(
          userActivity, 
          request
        );
        source = 'favorites';
      }
      
      // If not enough from favorites, try likes
      if (recommendations.length < limit) {
        const likeRecommendations = await this.getRecommendationsFromLikes(
          userActivity,
          request,
          recommendations.map(r => r.id)
        );
        recommendations = [...recommendations, ...likeRecommendations];
        if (source === 'fallback') source = 'likes';
      }

      // If still not enough, try purchases
      if (recommendations.length < limit) {
        const purchaseRecommendations = await this.getRecommendationsFromPurchases(
          userActivity,
          request,
          recommendations.map(r => r.id)
        );
        recommendations = [...recommendations, ...purchaseRecommendations];
        if (source === 'fallback') source = 'purchases';
      }

      // If still not enough, get fallback
      if (recommendations.length < limit) {
        const fallbackResponse = await this.getFallbackRecommendations(
          request,
          recommendations.map(r => r.id)
        );
        recommendations = [...recommendations, ...fallbackResponse.products];
      }

      // Limit results and add user interaction data
      const limitedRecommendations = recommendations.slice(0, limit);
      const enrichedRecommendations = await this.enrichWithUserData(
        limitedRecommendations,
        request.userId
      );

      return {
        products: enrichedRecommendations,
        hasMore: recommendations.length > limit,
        total: recommendations.length,
        source,
        fallbackUsed: source === 'fallback'
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return await this.getFallbackRecommendations(request);
    }
  }

  private static async getRecommendationsFromFavorites(
    userActivity: UserActivityData,
    request: RecommendationRequest
  ): Promise<RecommendedProduct[]> {
    const excludeIds = [request.currentProductId].filter(Boolean) as string[];
    const limit = request.limit || 5;
    
    return await ProductSimilarityService.findSimilarProducts(
      userActivity.favoriteProductIds,
      excludeIds,
      limit
    );
  }

  private static async getRecommendationsFromLikes(
    userActivity: UserActivityData,
    request: RecommendationRequest,
    excludeIds: string[]
  ): Promise<RecommendedProduct[]> {
    const additionalExcludeIds = [request.currentProductId, ...excludeIds].filter(Boolean) as string[];
    const limit = request.limit || 5;
    
    return await ProductSimilarityService.findSimilarProducts(
      userActivity.likedProductIds,
      additionalExcludeIds,
      limit - excludeIds.length
    );
  }

  private static async getRecommendationsFromPurchases(
    userActivity: UserActivityData,
    request: RecommendationRequest,
    excludeIds: string[]
  ): Promise<RecommendedProduct[]> {
    const additionalExcludeIds = [request.currentProductId, ...excludeIds].filter(Boolean) as string[];
    const limit = request.limit || 5;
    
    return await ProductSimilarityService.findSimilarProducts(
      userActivity.purchasedProductIds,
      additionalExcludeIds,
      limit - excludeIds.length
    );
  }

  private static async getFallbackRecommendations(
    request: RecommendationRequest,
    excludeIds: string[] = []
  ): Promise<RecommendationResponse> {
    try {
      const additionalExcludeIds = [request.currentProductId, ...excludeIds].filter(Boolean) as string[];
      
      // Get newest and best-selling products
      const [newestProducts, popularProducts] = await Promise.all([
        this.getNewestProducts(additionalExcludeIds, Math.ceil((request.limit || 5) / 2)),
        this.getPopularProducts(additionalExcludeIds, Math.floor((request.limit || 5) / 2))
      ]);

      // Combine and deduplicate
      const allProducts = [...newestProducts, ...popularProducts];
      const uniqueProducts = this.deduplicateProducts(allProducts);
      
      const limitedProducts = uniqueProducts.slice(0, request.limit || 5);
      const enrichedProducts = await this.enrichWithUserData(limitedProducts, request.userId);

      return {
        products: enrichedProducts,
        hasMore: uniqueProducts.length > (request.limit || 5),
        total: uniqueProducts.length,
        source: 'fallback',
        fallbackUsed: true
      };

    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return {
        products: [],
        hasMore: false,
        total: 0,
        source: 'fallback',
        fallbackUsed: true
      };
    }
  }

  private static async getNewestProducts(
    excludeIds: string[],
    limit: number
  ): Promise<RecommendedProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { active: true },
          { id: { notIn: excludeIds } },
          { inventory: { is: { inStock: { gt: 0 } } } }
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
  }

  private static async getPopularProducts(
    excludeIds: string[],
    limit: number
  ): Promise<RecommendedProduct[]> {
    // Get products with most favorites and likes
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { active: true },
          { id: { notIn: excludeIds } },
          { inventory: { is: { inStock: { gt: 0 } } } }
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
      orderBy: [
        { favorites: { _count: 'desc' } },
        { productLikes: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return products.map(product => this.mapToRecommendedProduct(product, []));
  }

  private static async enrichWithUserData(
    products: RecommendedProduct[],
    userId: string
  ): Promise<RecommendedProduct[]> {
    try {
      const productIds = products.map(p => p.id);
      
      const [userFavorites, userLikes] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId, productId: { in: productIds } },
          select: { productId: true }
        }),
        prisma.productLike.findMany({
          where: { userId, productId: { in: productIds } },
          select: { productId: true }
        })
      ]);

      const favoriteIds = new Set(userFavorites.map(f => f.productId));
      const likeIds = new Set(userLikes.map(l => l.productId));

      return products.map(product => ({
        ...product,
        isFavorited: favoriteIds.has(product.id),
        isLiked: likeIds.has(product.id)
      }));

    } catch (error) {
      console.error('Error enriching with user data:', error);
      return products;
    }
  }

  private static mapToRecommendedProduct(product: any, userFavorites: string[]): RecommendedProduct {
    const primaryImage = Array.isArray(product?.images) && product.images[0]?.src 
      ? product.images[0].src 
      : undefined;

    return {
      id: product?.id,
      slug: product?.slug,
      name: product?.name,
      priceCents: product?.variants?.[0]?.priceCents ?? product?.priceCents,
      currency: product?.currency,
      imageSrc: primaryImage,
      inStock: product?.inventory?.inStock ?? 0,
      lowStockAt: product?.inventory?.lowStockAt,
      brand: product?.brand,
      categories: Array.isArray(product?.categories) ? product.categories.map((c: any) => c?.slug) : [],
      favoriteCount: Array.isArray(product?.favorites) ? product.favorites.length : 0,
      likeCount: Array.isArray(product?.productLikes) ? product.productLikes.length : 0,
      isFavorited: product?.id ? userFavorites.includes(product.id) : false,
      isLiked: false // Will be set by enrichWithUserData
    };
  }

  private static deduplicateProducts(products: RecommendedProduct[]): RecommendedProduct[] {
    const seen = new Set<string>();
    return products.filter(product => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }
}
