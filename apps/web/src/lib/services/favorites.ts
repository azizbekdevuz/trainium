import 'server-only'
import { prisma } from '../../lib/database/db'
import { RecommendationCacheInvalidation } from './recommendations/cache-invalidation'

export async function isProductFavoritedByUser(userId: string, productId: string): Promise<boolean> {
  const fav = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  return !!fav
}

export async function toggleFavorite(userId: string, productId: string): Promise<{ favorited: boolean; count: number }> {
  const exists = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  
  let result: { favorited: boolean; count: number };
  
  if (exists) {
    await prisma.favorite.delete({ where: { userId_productId: { userId, productId } } })
    const count = await prisma.favorite.count({ where: { productId } })
    result = { favorited: false, count }
  } else {
    await prisma.favorite.create({ data: { userId, productId } })
    const count = await prisma.favorite.count({ where: { productId } })
    result = { favorited: true, count }
  }

  // Invalidate recommendation cache
  await RecommendationCacheInvalidation.onFavoriteChange(userId);
  
  return result;
}

export async function listUserFavoriteProducts(userId: string, take = 12, cursor?: string) {
  const items = await prisma.favorite.findMany({
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


