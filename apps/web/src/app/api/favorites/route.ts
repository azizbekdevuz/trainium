import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { listUserFavoriteProducts } from '../../../lib/services/favorites'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const take = Math.max(1, Math.min(50, Number(searchParams.get('take') ?? '12') || 12))
  const cursor = searchParams.get('cursor') || undefined

  try {
    const { items, nextCursor } = await listUserFavoriteProducts(session.user.id, take, cursor)
    return NextResponse.json({ items, nextCursor })
  } catch (err) {
    console.error('favorites list failed', err)
    return NextResponse.json({ error: 'Failed to list favorites' }, { status: 500 })
  }
}


