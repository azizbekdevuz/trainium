import { RecommendationCacheService } from './cache-service';

export class RecommendationCacheInvalidation {
  /**
   * Invalidate user's recommendation cache when they favorite/unfavorite a product
   */
  static async onFavoriteChange(userId: string): Promise<void> {
    try {
      RecommendationCacheService.invalidateUser(userId);
    } catch (error) {
      console.error('Error invalidating recommendation cache on favorite change:', error);
    }
  }

  /**
   * Invalidate user's recommendation cache when they like/unlike a product
   */
  static async onLikeChange(userId: string): Promise<void> {
    try {
      RecommendationCacheService.invalidateUser(userId);
    } catch (error) {
      console.error('Error invalidating recommendation cache on like change:', error);
    }
  }

  /**
   * Invalidate user's recommendation cache when they make a purchase
   */
  static async onPurchase(userId: string): Promise<void> {
    try {
      RecommendationCacheService.invalidateUser(userId);
    } catch (error) {
      console.error('Error invalidating recommendation cache on purchase:', error);
    }
  }

  /**
   * Invalidate all recommendation caches (admin function)
   */
  static async invalidateAll(): Promise<void> {
    try {
      RecommendationCacheService.invalidateAll();
    } catch (error) {
      console.error('Error invalidating all recommendation caches:', error);
    }
  }
}
