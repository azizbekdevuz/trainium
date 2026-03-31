import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'path'
import { sanitizeFilename } from '@/lib/utils/path-safety'
import { getPublicBlobStorage, isStorageBackendError } from '@/lib/storage/blob-storage'
import { storageLog } from '@/lib/storage/storage-log'

export const runtime = 'nodejs'

const VARIANT_WIDTHS = [256, 512, 768, 1024] as const

function getContentType(ext: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}

async function tryFindWebPVariant(
  storage: { exists: (k: string) => Promise<boolean> },
  filename: string,
  requestedWidth: number | null
): Promise<string | null> {
  const { name } = parse(filename)

  if (requestedWidth !== null && requestedWidth > 0) {
    const widths = VARIANT_WIDTHS.filter((w) => w >= requestedWidth)
    if (widths.length) {
      const keys = widths.map((w) => `${name}_${w}.webp`)
      const flags = await Promise.all(keys.map((k) => storage.exists(k)))
      for (let i = 0; i < keys.length; i++) {
        if (flags[i]) return keys[i]!
      }
    }
  }

  const webpName = `${name}.webp`
  if (await storage.exists(webpName)) {
    return webpName
  }

  return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const safe = sanitizeFilename(filename)
  if (!safe) return NextResponse.json({ ok: false }, { status: 400 })

  const storage = getPublicBlobStorage()

  const acceptHeader = request.headers.get('accept') || ''
  const acceptsWebp = acceptHeader.includes('image/webp')

  const widthParam = request.nextUrl.searchParams.get('w')
  const parsedW = widthParam ? parseInt(widthParam, 10) : NaN
  const requestedWidth = Number.isFinite(parsedW) && parsedW > 0 ? parsedW : null

  let fileToServe = safe

  const ext = safe.split('.').pop()?.toLowerCase()
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')

  if (isImage && acceptsWebp) {
    const webpVariant = await tryFindWebPVariant(storage, safe, requestedWidth)
    if (webpVariant) {
      fileToServe = webpVariant
    }
  }

  let data: Buffer
  try {
    const bytes = await storage.getBytes(fileToServe)
    if (!bytes) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }
    data = bytes
  } catch (e) {
    if (isStorageBackendError(e)) {
      storageLog('error', 'upload_route_get_failed', {
        key: fileToServe,
        message: e.message,
      })
    } else {
      storageLog('error', 'upload_route_get_failed', {
        key: fileToServe,
        message: e instanceof Error ? e.message : 'unknown',
      })
    }
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const servedExt = fileToServe.split('.').pop()?.toLowerCase() || ''
  const type = getContentType(servedExt)

  const view = new Uint8Array(data)
  const arrayBuffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
  const blob = new Blob([arrayBuffer], { type })

  const cacheControl =
    fileToServe !== safe ? 'public, max-age=31536000, immutable' : 'no-store, max-age=0'

  return new NextResponse(blob, {
    headers: {
      'Content-Type': type,
      'Cache-Control': cacheControl,
      Vary: 'Accept',
    },
  })
}
