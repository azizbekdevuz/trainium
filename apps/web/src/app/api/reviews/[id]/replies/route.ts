import { NextRequest, NextResponse } from 'next/server'
import { listReplies } from '../../../../../lib/services/reviews'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url)
  const take = Math.max(1, Math.min(25, Number(searchParams.get('take') ?? '5') || 5))
  const cursor = searchParams.get('cursor') || undefined
  try {
    const { id } = await params
    const data = await listReplies(id, take, cursor)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to list replies' }, { status: 500 })
  }
}


