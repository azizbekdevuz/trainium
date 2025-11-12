import 'server-only'
import { prisma } from '../../lib/database/db'
import { RecommendationCacheInvalidation } from './recommendations/cache-invalidation'

export async function isProductLikedByUser(userId: string, productId: string): Promise<boolean> {
  const like = await prisma.productLike.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  return !!like
}

export async function toggleProductLike(userId: string, productId: string): Promise<{ liked: boolean; count: number }> {
  const existing = await prisma.productLike.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  
  if (existing) {
    await prisma.productLike.delete({ where: { userId_productId: { userId, productId } } })
  } else {
    await prisma.productLike.create({ data: { userId, productId } })
  }
  
  const count = await prisma.productLike.count({ where: { productId } })
  const result = { liked: !existing, count };

  // Invalidate recommendation cache
  await RecommendationCacheInvalidation.onLikeChange(userId);
  
  return result;
}

export async function isReviewLikedByUser(userId: string, reviewId: string): Promise<boolean> {
  const like = await prisma.reviewLike.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
    select: { id: true },
  })
  return !!like
}

export async function toggleReviewLike(userId: string, reviewId: string): Promise<{ liked: boolean; count: number }> {
  const existing = await prisma.reviewLike.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
    select: { id: true },
  })
  if (existing) {
    await prisma.reviewLike.delete({ where: { userId_reviewId: { userId, reviewId } } })
  } else {
    await prisma.reviewLike.create({ data: { userId, reviewId } })
  }
  const count = await prisma.reviewLike.count({ where: { reviewId } })
  return { liked: !existing, count }
}

export async function listUserLikedProducts(userId: string, take = 12, cursor?: string) {
  const items = await prisma.productLike.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      product: {
        include: { categories: true, variants: { take: 1, orderBy: { priceCents: 'asc' } }, inventory: true },
      },
    },
  })
  const hasMore = items.length > take
  const slice = items.slice(0, take)
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined
  return { items: slice, nextCursor }
}


