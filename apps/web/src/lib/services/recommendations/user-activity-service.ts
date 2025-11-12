import { prisma } from '../../database/db';
import { UserActivityData } from './types';

export class UserActivityService {
  /**
   * Fetch user's activity data for recommendations
   * Priority: Favorites > Likes > Purchases
   */
  static async getUserActivityData(userId: string): Promise<UserActivityData> {
    try {
      const [favorites, likes, purchases] = await Promise.all([
        this.getUserFavorites(userId),
        this.getUserLikes(userId),
        this.getUserPurchases(userId)
      ]);

      return {
        favoriteProductIds: favorites.productIds,
        likedProductIds: likes.productIds,
        purchasedProductIds: purchases.productIds,
        favoriteCategories: favorites.categories,
        likedCategories: likes.categories,
        purchasedCategories: purchases.categories,
      };
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      return {
        favoriteProductIds: [],
        likedProductIds: [],
        purchasedProductIds: [],
        favoriteCategories: [],
        likedCategories: [],
        purchasedCategories: [],
      };
    }
  }

  private static async getUserFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            categories: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    });

    return {
      productIds: favorites.map(f => f.productId),
      categories: favorites.flatMap(f => f.product.categories.map(c => c.slug))
    };
  }

  private static async getUserLikes(userId: string) {
    const likes = await prisma.productLike.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            categories: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    });

    return {
      productIds: likes.map(l => l.productId),
      categories: likes.flatMap(l => l.product.categories.map(c => c.slug))
    };
  }

  private static async getUserPurchases(userId: string) {
    const purchases = await prisma.order.findMany({
      where: { 
        userId,
        status: { in: ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'] }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                categories: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit for performance
    });

    const productIds = purchases.flatMap(order => 
      order.items.map(item => item.productId)
    );

    const categories = purchases.flatMap(order =>
      order.items.flatMap(item => 
        item.product.categories.map(c => c.slug)
      )
    );

    return {
      productIds: [...new Set(productIds)], // Remove duplicates
      categories: [...new Set(categories)] // Remove duplicates
    };
  }

  /**
   * Check if user has any activity data
   */
  static async hasUserActivity(userId: string): Promise<boolean> {
    const [favoriteCount, likeCount, purchaseCount] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.productLike.count({ where: { userId } }),
      prisma.order.count({ 
        where: { 
          userId,
          status: { in: ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'] }
        }
      })
    ]);

    return favoriteCount > 0 || likeCount > 0 || purchaseCount > 0;
  }
}
