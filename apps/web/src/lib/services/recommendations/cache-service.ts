import { RecommendationResponse, RecommendationCache } from './types';

export class RecommendationCacheService {
  private static cache = new Map<string, RecommendationCache>();
  private static readonly CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds

  /**
   * Generate cache key for recommendations
   */
  private static generateCacheKey(
    userId: string,
    context: string,
    limit: number,
    offset: number,
    currentProductId?: string
  ): string {
    const parts = [userId, context, limit.toString(), offset.toString()];
    if (currentProductId) {
      parts.push(currentProductId);
    }
    return `rec:${parts.join(':')}`;
  }

  /**
   * Get cached recommendations
   */
  static get(
    userId: string,
    context: string,
    limit: number,
    offset: number,
    currentProductId?: string
  ): RecommendationResponse | null {
    const key = this.generateCacheKey(userId, context, limit, offset, currentProductId);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached recommendations
   */
  static set(
    userId: string,
    context: string,
    limit: number,
    offset: number,
    data: RecommendationResponse,
    currentProductId?: string
  ): void {
    const key = this.generateCacheKey(userId, context, limit, offset, currentProductId);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      userId,
      context
    });

    // Clean up expired entries periodically
    this.cleanupExpiredEntries();
  }

  /**
   * Invalidate cache for a specific user
   */
  static invalidateUser(userId: string): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.userId === userId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache entries
   */
  static invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}
