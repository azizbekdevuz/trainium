import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { processUploadedImage } from '@/lib/image/image-processor'

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'storage', 'uploads')
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
    const base = file.name.replace(/\.[^.]+$/, '')
    const unique = `${sanitizeFileName(base)}_${Date.now()}.` + (ext || 'bin')

    const processed = await processUploadedImage(buffer, unique, uploadsDir)

    const url = `/uploads/${unique}`
    const res = NextResponse.json({ 
      success: true, 
      url, 
      filename: unique,
      variants: processed.variants 
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch {
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
