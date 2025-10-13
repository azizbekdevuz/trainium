import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RecommendationEngine } from '@/lib/services/recommendations/recommendation-engine';
import { RecommendationCacheService } from '@/lib/services/recommendations/cache-service';
import { RecommendationRequest } from '@/lib/services/recommendations/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || 'home';
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');
    const currentProductId = searchParams.get('currentProductId') || undefined;

    // Validate parameters
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    if (isAuthenticated && session?.user?.id) {
      // Authenticated user flow
      const userId = session.user.id;
      // const cacheKey = `${userId}:${context}:${limit}:${offset}:${currentProductId || ''}`;
      const cached = RecommendationCacheService.get(
        userId,
        context,
        limit,
        offset,
        currentProductId
      );

      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true
        });
      }

      // Generate personalized recommendations
      const recommendationRequest: RecommendationRequest = {
        userId,
        context: context as 'product' | 'home' | 'cart',
        currentProductId,
        limit,
        offset
      };

      const recommendations = await RecommendationEngine.generateRecommendations(
        recommendationRequest
      );

      // Cache the results
      RecommendationCacheService.set(
        userId,
        context,
        limit,
        offset,
        recommendations,
        currentProductId
      );

      return NextResponse.json({
        ...recommendations,
        cached: false
      });
    } else {
      // Unauthenticated user flow - show general recommendations
      const generalRecommendations = await RecommendationEngine.getGeneralRecommendations(
        context as 'product' | 'home' | 'cart',
        currentProductId,
        limit,
        offset
      );

      return NextResponse.json({
        ...generalRecommendations,
        cached: false,
        authenticated: false
      });
    }

  } catch (error) {
    console.error('Error in recommendations API:', error);
    
    // Return fallback response
    return NextResponse.json({
      products: [],
      hasMore: false,
      total: 0,
      source: 'fallback',
      fallbackUsed: true,
      error: 'Failed to load recommendations'
    }, { status: 500 });
  }
}

// Handle cache invalidation for admin purposes
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId && session.user.role === 'ADMIN') {
      // Admin can invalidate any user's cache
      RecommendationCacheService.invalidateUser(userId);
    } else {
      // User can only invalidate their own cache
      RecommendationCacheService.invalidateUser(session.user.id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error invalidating recommendation cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}
