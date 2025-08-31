export interface RecommendationRequest {
  userId: string;
  context?: 'product' | 'home' | 'cart';
  currentProductId?: string; // For product page context
  limit?: number;
  offset?: number;
}

export interface RecommendationResponse {
  products: RecommendedProduct[];
  hasMore: boolean;
  total: number;
  source: RecommendationSource;
  fallbackUsed: boolean;
}

export interface RecommendedProduct {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageSrc?: string;
  inStock: number;
  lowStockAt?: number;
  brand?: string;
  categories: string[];
  // Social data
  favoriteCount: number;
  likeCount: number;
  isFavorited: boolean;
  isLiked: boolean;
}

export type RecommendationSource = 
  | 'favorites'
  | 'likes' 
  | 'purchases'
  | 'similar_products'
  | 'popular'
  | 'newest'
  | 'fallback';

export interface UserActivityData {
  favoriteProductIds: string[];
  likedProductIds: string[];
  purchasedProductIds: string[];
  favoriteCategories: string[];
  likedCategories: string[];
  purchasedCategories: string[];
}

export interface RecommendationConfig {
  maxRecommendations: number;
  cacheDuration: number; // in seconds
  fallbackLimit: number;
  similarityThreshold: number;
}

export interface RecommendationCache {
  data: RecommendationResponse;
  timestamp: number;
  userId: string;
  context: string;
}
