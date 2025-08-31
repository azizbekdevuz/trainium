'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/components/providers/I18nProvider';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
// import { Alert, AlertDescription } from '../ui/alert';
import { 
  RecommendedProduct, 
  RecommendationResponse, 
  RecommendationSource 
} from '@/lib/services/recommendations/types';
import { 
  Heart, 
  ThumbsUp, 
  ShoppingBag, 
  Star, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { FitnessCharacter } from '../ui/FitnessCharacter';

interface RecommendedProductsProps {
  context?: 'product' | 'home' | 'cart';
  currentProductId?: string;
  initialLimit?: number;
  showTitle?: boolean;
  className?: string;
}

export function RecommendedProducts({
  context = 'home',
  currentProductId,
  initialLimit = 5,
  showTitle = true,
  className = ''
}: RecommendedProductsProps) {
  const { t } = useI18n();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState<RecommendationSource>('fallback');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);

  // Load initial recommendations
  useEffect(() => {
    loadRecommendations(0, initialLimit, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, currentProductId, initialLimit]);

  const loadRecommendations = async (
    newOffset: number, 
    limit: number, 
    isInitial: boolean = false
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        context,
        limit: limit.toString(),
        offset: newOffset.toString(),
        ...(currentProductId && { currentProductId })
      });

      const response = await fetch(`/api/recommendations?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: RecommendationResponse = await response.json();

      if (isInitial) {
        setRecommendations(data.products);
        setOffset(limit);
        setReachedEnd(false);
      } else {
        setRecommendations(prev => {
          // Create a map to track existing product IDs
          const existingIds = new Set(prev.map(p => p.id));
          // Filter out duplicates from new products
          const newProducts = data.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
        setOffset(prev => prev + limit);
      }

      setHasMore(data.hasMore);
      setSource(data.source);
      setFallbackUsed(data.fallbackUsed);
      
      // Track when we've reached the end
      if (!data.hasMore && !isInitial) {
        setReachedEnd(true);
      }

    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Show fallback content on error
      if (isInitial) {
        setRecommendations([]);
        setFallbackUsed(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleShowMore = () => {
    loadRecommendations(offset, 5, false);
  };

  const getTitle = (): string => {
    if (error) return t('recommendations.comingSoon');
    
    // Check if user is authenticated by looking at the source
    const isAuthenticated = source !== 'fallback' || !fallbackUsed;
    
    if (!isAuthenticated) {
      // For unauthenticated users, show general titles
      switch (context) {
        case 'product':
          return t('recommendations.titleSimilar');
        case 'cart':
          return t('recommendations.titlePurchases');
        default:
          return t('recommendations.titlePopular');
      }
    }
    
    switch (source) {
      case 'favorites':
        return t('recommendations.titleFavorites');
      case 'likes':
        return t('recommendations.titleLikes');
      case 'purchases':
        return t('recommendations.titlePurchases');
      case 'similar_products':
        return t('recommendations.titleSimilar');
      case 'popular':
        return t('recommendations.titlePopular');
      case 'newest':
        return t('recommendations.titleNewest');
      default:
        return t('recommendations.titleFallback');
    }
  };

  const getSourceIcon = () => {
    switch (source) {
      case 'favorites':
        return <Heart className="h-4 w-4" />;
      case 'likes':
        return <ThumbsUp className="h-4 w-4" />;
      case 'purchases':
        return <ShoppingBag className="h-4 w-4" />;
      case 'popular':
        return <Star className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case 'favorites':
        return 'text-red-500 dark:text-red-400';
      case 'likes':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'purchases':
        return 'text-blue-500 dark:text-blue-400';
      case 'popular':
        return 'text-yellow-500 dark:text-yellow-400';
      default:
        return 'text-purple-500 dark:text-purple-400';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <section className={`mx-auto max-w-7xl px-6 py-8 ${className}`}>
        {showTitle && (
          <div className="flex items-baseline justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch">
          {Array.from({ length: initialLimit }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state with fallback
  if (error && recommendations.length === 0) {
    return (
      <section className={`mx-auto max-w-7xl px-6 py-8 ${className}`}>
        {showTitle && (
          <div className="flex items-baseline justify-between mb-6">
            <div className="flex items-center gap-3">
              <FitnessCharacter size="md" expression="dissatisfied" className="text-amber-500" />
              <h2 className="font-display text-2xl">{t('recommendations.comingSoon')}</h2>
            </div>
          </div>
        )}
        <div className="text-center py-12">
          <FitnessCharacter size="lg" expression="dissatisfied" className="mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground text-lg">{t('recommendations.error')}</p>
          <p className="text-sm text-muted-foreground mt-2">Our fitness expert is working hard to bring you the best recommendations!</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <section className={`mx-auto max-w-7xl px-6 py-8 ${className}`}>
        {showTitle && (
          <div className="flex items-baseline justify-between mb-6">
            <div className="flex items-center gap-3">
              <FitnessCharacter size="md" expression="thinking" className="text-amber-500" />
              <h2 className="font-display text-2xl">{t('recommendations.title')}</h2>
            </div>
          </div>
        )}
        <div className="text-center py-12">
          <FitnessCharacter size="lg" expression="thinking" className="mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground text-lg">{t('recommendations.empty')}</p>
          <p className="text-sm text-muted-foreground mt-2">Our fitness expert is analyzing the best products for you!</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`mx-auto max-w-7xl px-6 py-8 ${className}`}>
      {showTitle && (
        <div className="flex items-baseline justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`${getSourceColor()}`}>
              {getSourceIcon()}
            </div>
            <h2 className="font-display text-2xl">{getTitle()}</h2>
            {fallbackUsed && source === 'fallback' && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {t('recommendations.basedOn')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error banner (if there's an error but we have some recommendations) */}
      {error && recommendations.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <FitnessCharacter size="sm" expression="dissatisfied" className="text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('recommendations.error')} - But we found some great alternatives!
            </p>
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch">
        {recommendations.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            slug={product.slug}
            name={product.name}
            priceCents={product.priceCents}
            currency={product.currency}
            imageSrc={product.imageSrc}
            inStock={product.inStock}
            lowStockAt={product.lowStockAt}
            productId={product.id}
            initiallyFavorited={product.isFavorited}
            initialFavCount={product.favoriteCount}
            initialLiked={product.isLiked}
            initialLikeCount={product.likeCount}
            showSocialCounts={true}
          />
        ))}
      </div>

      {/* Show more button or end message */}
      {hasMore ? (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleShowMore}
            disabled={loadingMore}
            variant="outline"
            className="min-w-32 rounded-2xl"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading', "Loading...")}
              </>
            ) : (
              t('recommendations.showMore', "Show more")
            )}
          </Button>
        </div>
      ) : reachedEnd && recommendations.length > 0 ? (
        <div className="flex justify-center mt-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              {t('recommendations.noMoreProducts')}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
