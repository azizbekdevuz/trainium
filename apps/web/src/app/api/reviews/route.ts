import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createReview, listReviewsWithReplies } from '../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || ''
  const take = Math.max(1, Math.min(50, Number(searchParams.get('take') ?? '10') || 10))
  const cursor = searchParams.get('cursor') || undefined
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  try {
    const data = await listReviewsWithReplies({ productId, take, cursor })
    return NextResponse.json(data)
  } catch (err) {
    console.error('reviews list failed', err)
    return NextResponse.json({ error: 'Failed to list reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({} as any))
  const { productId, rating, title, content } = body ?? {}
  if (!productId || typeof rating !== 'number' || !content) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  try {
    const created = await createReview({ userId: session.user.id, productId, rating, title, body: content })
    return NextResponse.json({ id: created.id })
  } catch (err) {
    if (String((err as any)?.message).startsWith('ALREADY_REVIEWED')) {
      return NextResponse.json({ error: (err as any).message }, { status: 409 })
    }
    console.error('review create failed', err)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}


