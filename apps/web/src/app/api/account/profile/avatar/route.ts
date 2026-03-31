import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '../../../../../lib/database/db'
import {
  getPublicBlobStorage,
  contentTypeForFilename,
  isStorageBackendError,
} from '@/lib/storage/blob-storage'
import { storageLog } from '@/lib/storage/storage-log'
import { uploadKeyFromPublicUrl } from '@/lib/storage/upload-paths'
import { deleteUploadKeyAndLegacyVariants } from '@/lib/storage/delete-public-upload'

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
    const storage = getPublicBlobStorage()

    const prior = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })
    const oldKey = uploadKeyFromPublicUrl(prior?.image ?? '')

    const rawExt = file.name.includes('.') ? (file.name.split('.').pop() || 'jpg') : 'jpg'
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const unique = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
    await storage.put(unique, buffer, contentTypeForFilename(unique))
    const url = `/uploads/${unique}`

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
      select: { id: true, name: true, email: true, image: true },
    })

    if (oldKey && oldKey !== unique) {
      await deleteUploadKeyAndLegacyVariants(storage, oldKey)
    }

    const res = NextResponse.json({ success: true, url, user: updated })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (err) {
    if (isStorageBackendError(err)) {
      storageLog('error', 'api_avatar_storage_failed', { message: err.message })
      return NextResponse.json({ success: false, error: 'Failed to upload avatar' }, { status: 503 })
    }
    storageLog('error', 'api_avatar_failed', {
      message: err instanceof Error ? err.message : 'unknown',
    })
    return NextResponse.json({ success: false, error: 'Failed to upload avatar' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } })
    const current = user?.image || ''
    const storage = getPublicBlobStorage()
    const key = uploadKeyFromPublicUrl(current)
    if (key) {
      await deleteUploadKeyAndLegacyVariants(storage, key)
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
