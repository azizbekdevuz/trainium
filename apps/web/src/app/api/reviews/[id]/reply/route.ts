import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { replyToReview } from '../../../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: reviewId } = await params
  const { content } = await req.json().catch(() => ({}))
  if (!reviewId || !content) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  try {
    const created = await replyToReview({ userId: session.user.id, parentId: reviewId, body: content })
    return NextResponse.json({ id: created.id })
  } catch (err) {
    console.error('review reply failed', err)
    return NextResponse.json({ error: 'Failed to reply' }, { status: 500 })
  }
}


