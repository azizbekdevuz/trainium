import { NextRequest, NextResponse } from 'next/server'
import { resolve, relative } from 'path'
import { readFile } from 'fs/promises'
import { sanitizeFilename } from '@/lib/utils/path-safety'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const safe = sanitizeFilename(filename)
  if (!safe) return NextResponse.json({ ok: false }, { status: 400 })

  const uploadsDir = resolve(process.cwd(), 'storage', 'uploads')
  const filePath = resolve(uploadsDir, safe)
  const rel = relative(uploadsDir, filePath)
  if (rel.startsWith('..')) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    const data = await readFile(filePath)
    const ext = safe.split('.').pop()?.toLowerCase()
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


