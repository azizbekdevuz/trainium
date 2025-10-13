import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { toggleProductLike } from '../../../../../lib/services/likes'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: productId } = await params
  if (!productId) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }
  try {
    const result = await toggleProductLike(session.user.id, productId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('product like toggle failed', err)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}


