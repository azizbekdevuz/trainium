import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { softDeleteReview, undoDeleteReview } from '../../../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action } = await req.json().catch(() => ({ action: 'delete' }))
  try {
    const { id } = await params
    if (action === 'undo') {
      const r = await undoDeleteReview({ reviewId: id, userId: session.user.id })
      return NextResponse.json({ ok: true, status: r.status })
    }
    const r = await softDeleteReview({ reviewId: id, userId: session.user.id })
    return NextResponse.json({ ok: true, status: r.status })
  } catch (e: unknown) {
    console.error('review delete failed', e)
    return NextResponse.json({ error: 'Failed' }, { status: 400 })
  }
}


