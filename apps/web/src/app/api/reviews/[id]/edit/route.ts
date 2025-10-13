import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { editReviewWithRating } from '../../../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, body, rating } = await req.json().catch(() => ({}))
  try {
    const { id } = await params
    const updated = await editReviewWithRating({ reviewId: id, userId: session.user.id, title, body, rating })
    return NextResponse.json({ id: updated.id, editedAt: updated.editedAt, editCount: updated.editCount })
  } catch (e: any) {
    if (String(e?.message) === 'RATE_LIMIT') return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    if (String(e?.message) === 'RATING_TOO_SOON') return NextResponse.json({ error: 'Rating change allowed after 7 days' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to edit review' }, { status: 400 })
  }
}


