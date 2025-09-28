import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    // Prefer saving to /public/uploads so frontend can reference a stable URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Store under storage/uploads and serve via dynamic route to avoid static file-server caching
    const uploadsDir = join(process.cwd(), 'storage', 'uploads')
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
    const base = file.name.replace(/\.[^.]+$/, '')
    const unique = `${sanitizeFileName(base)}_${Date.now()}.` + (ext || 'bin')
    const filePath = join(uploadsDir, unique)

    await writeFile(filePath, buffer)
    const url = `/uploads/${unique}`
    const res = NextResponse.json({ success: true, url, filename: unique })
    // Prevent caching so new files are immediately visible
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch {
    // Fallback: return data URL so UI can still preview without breaking other flows
    try {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) throw new Error('No file')
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const url = `data:${file.type};base64,${base64}`
      return NextResponse.json({ success: true, url })
    } catch {
      console.error('Upload error')
      return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 })
    }
  }
}
