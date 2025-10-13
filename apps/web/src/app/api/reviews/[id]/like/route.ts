import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { toggleReviewLike } from '../../../../../lib/services/likes'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: reviewId } = await params
  if (!reviewId) return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
  try {
    const result = await toggleReviewLike(session.user.id, reviewId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('review like toggle failed', err)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}


