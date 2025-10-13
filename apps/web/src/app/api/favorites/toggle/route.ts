import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { toggleFavorite } from '../../../../lib/services/favorites'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await req.json().catch(() => ({}))
  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
  }

  try {
    const result = await toggleFavorite(session.user.id, productId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('favorite toggle failed', err)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
}


