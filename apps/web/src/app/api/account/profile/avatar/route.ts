import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '../../../../../lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file || !file.size) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
  // Store under storage/uploads and serve via dynamic route to avoid static file-server caching
  const uploadsDir = join(process.cwd(), 'storage', 'uploads')
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
    const base = file.name.replace(/\.[^.]+$/, '')
    const unique = `${base}_${Date.now()}.${ext || 'bin'}`
    const filePath = join(uploadsDir, unique)
    await writeFile(filePath, buffer)
    const url = `/uploads/${unique}`

    // Persist on user immediately to avoid a second call
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
      select: { id: true, name: true, email: true, image: true },
    })

    const res = NextResponse.json({ success: true, url, user: updated })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (err) {
    console.error('Avatar upload failed', err)
    return NextResponse.json({ success: false, error: 'Failed to upload avatar' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } })
    const current = user?.image || ''
    if (current && current.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'storage', current)
      try {
        // Optional cleanup – ignore errors if file already gone
        await import('fs/promises').then(m => m.unlink(filePath)).catch(() => {})
      } catch (e) {
        console.error('Avatar delete failed', e)
      }
    }
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: { id: true, name: true, email: true, image: true },
    })
    return NextResponse.json({ success: true, user: updated })
  } catch (err) {
    console.error('Avatar delete failed', err)
    return NextResponse.json({ success: false, error: 'Failed to remove avatar' }, { status: 500 })
  }
}


