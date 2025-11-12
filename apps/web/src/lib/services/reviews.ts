import 'server-only'
import { prisma } from '../../lib/database/db'

export type ReviewListOptions = {
  productId: string
  take?: number
  cursor?: string
}

export async function listReviewsWithReplies(options: ReviewListOptions) {
  const take = options.take ?? 10
  const items = await prisma.review.findMany({
    where: ({ productId: options.productId, parentId: null, status: 'ACTIVE' } as any),
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    skip: options.cursor ? 1 : 0,
    cursor: options.cursor ? { id: options.cursor } : undefined,
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
      likes: { select: { id: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, image: true, email: true } }, likes: { select: { id: true } } },
      },
      ...( { _count: { select: { replies: true } } } as any ),
    },
  })

  const hasMore = items.length > take
  const slice = items.slice(0, take)
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined

  return { items: slice, nextCursor }
}

export async function listReplies(parentId: string, take = 5, cursor?: string) {
  const items = await prisma.review.findMany({
    where: ({ parentId } as any),
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: { user: { select: { id: true, name: true, image: true, email: true } }, likes: { select: { id: true } } },
  })
  const hasMore = items.length > take
  const slice = items.slice(0, take)
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : undefined
  return { items: slice, nextCursor }
}

export async function createReview(params: { userId: string; productId: string; rating: number; title?: string; body: string }) {
  if (params.rating < 1 || params.rating > 5) throw new Error('Invalid rating')
  // Enforce one review per user per product (regardless of variants)
  const exists = await prisma.review.findFirst({ where: ({ productId: params.productId, userId: params.userId, parentId: null, status: 'ACTIVE' } as any), select: { id: true } })
  if (exists) throw new Error('ALREADY_REVIEWED_PRODUCT')
  return prisma.review.create({
    data: {
      productId: params.productId,
      userId: params.userId,
      rating: params.rating,
      title: params.title ?? null,
      body: params.body,
      // extra fields are allowed after prisma generate; cast now
      ...( { status: 'ACTIVE' } as any ),
    } as any,
  })
}

export async function replyToReview(params: { userId: string; parentId: string; body: string }) {
  const parent = await prisma.review.findUnique({ where: { id: params.parentId }, select: { id: true, productId: true } })
  if (!parent) throw new Error('Parent review not found')
  return prisma.review.create({
    data: {
      productId: parent.productId,
      userId: params.userId,
      body: params.body,
      parentId: parent.id,
      rating: 0,
      title: null,
      ...( { status: 'ACTIVE' } as any ),
    } as any,
  })
}

export async function editReview(params: { reviewId: string; userId: string; title?: string; body?: string }) {
  const current = await prisma.review.findUnique({ where: { id: params.reviewId }, select: ({ userId: true, updatedAt: true, status: true, editCount: true } as any) }) as any
  if (!current || current.userId !== params.userId || current.status !== 'ACTIVE') throw new Error('Forbidden')
  const now = new Date()
  if (current.updatedAt && now.getTime() - new Date(current.updatedAt).getTime() < 60_000) {
    throw new Error('RATE_LIMIT')
  }
  return prisma.review.update({
    where: { id: params.reviewId },
    data: { title: params.title ?? null, body: params.body ?? '', ...( { editedAt: now } as any ), ...( { editCount: ((current.editCount ?? 0) + 1) } as any ) } as any,
  })
}

export async function editReviewWithRating(params: { reviewId: string; userId: string; title?: string; body?: string; rating?: number }) {
  const current = await prisma.review.findUnique({ where: { id: params.reviewId }, select: ({ userId: true, updatedAt: true, createdAt: true, rating: true, status: true, editCount: true } as any) }) as any
  if (!current || current.userId !== params.userId || current.status !== 'ACTIVE') throw new Error('Forbidden')
  const now = new Date()
  if (current.updatedAt && now.getTime() - new Date(current.updatedAt).getTime() < 60_000) throw new Error('RATE_LIMIT')
  const canChangeRating = now.getTime() - new Date(current.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000
  const data: any = { title: params.title ?? null, body: params.body ?? '', editedAt: now, editCount: ((current.editCount ?? 0) + 1) }
  if (typeof params.rating === 'number' && params.rating >= 1 && params.rating <= 5 && params.rating !== current.rating) {
    if (!canChangeRating) throw new Error('RATING_TOO_SOON')
    data.rating= params.rating
  }
  return prisma.review.update({ where: { id: params.reviewId }, data })
}

export async function checkExistingReview(userId: string, productId: string) {
  const r = await prisma.review.findFirst({ where: ({ userId, productId, parentId: null, status: 'ACTIVE' } as any), select: ({ id: true, createdAt: true, status: true } as any) }) as any
  return r ?? null
}

export async function softDeleteReview(params: { reviewId: string; userId: string }) {
  const current = await prisma.review.findUnique({ where: { id: params.reviewId }, select: ({ userId: true, status: true } as any) }) as any
  if (!current || current.userId !== params.userId || current.status !== 'ACTIVE') throw new Error('Forbidden')
  const now = new Date()
  return prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: params.reviewId }, data: ({ status: 'DELETED', deletedAt: now } as any) })
    // Soft-delete direct replies as well for a clean thread
    await tx.review.updateMany({ where: ({ parentId: params.reviewId } as any), data: ({ status: 'DELETED', deletedAt: now } as any) })
    return { id: params.reviewId, status: 'DELETED' }
  }) as any
}

export async function undoDeleteReview(params: { reviewId: string; userId: string }) {
  const current = await prisma.review.findUnique({ where: { id: params.reviewId }, select: ({ userId: true, deletedAt: true, status: true } as any) }) as any
  if (!current || current.userId !== params.userId || current.status !== 'DELETED') throw new Error('Forbidden')
  if (!current.deletedAt || (Date.now() - new Date(current.deletedAt).getTime()) > 10 * 60_000) throw new Error('EXPIRED')
  return prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: params.reviewId }, data: ({ status: 'ACTIVE', deletedAt: null } as any) })
    await tx.review.updateMany({ where: ({ parentId: params.reviewId } as any), data: ({ status: 'ACTIVE', deletedAt: null } as any) })
    return { id: params.reviewId, status: 'ACTIVE' }
  }) as any
}


