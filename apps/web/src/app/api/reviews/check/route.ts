import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { checkExistingReview } from '../../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const productId = (searchParams.get('productId') || '').trim()
  if (!productId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const r = await checkExistingReview(session.user.id, productId)
  return NextResponse.json({ review: r })
}


