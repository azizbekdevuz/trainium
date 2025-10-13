import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  try {
    const filePath = join(process.cwd(), 'storage', 'uploads', filename)
    const data = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase()
    const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'application/octet-stream'

    // Convert Node Buffer to a standalone ArrayBuffer to satisfy BodyInit/Blob types
    const view = new Uint8Array(data)
    const arrayBuffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
    const blob = new Blob([arrayBuffer], { type })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
}


