import { NextRequest, NextResponse } from 'next/server'
import { resolve, relative, parse } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { sanitizeFilename } from '@/lib/utils/path-safety'
import { getUploadsRoot } from '@/lib/storage/upload-paths'

export const runtime = 'nodejs'

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

function tryFindWebPVariant(
  uploadsDir: string,
  filename: string,
  requestedWidth: number | null
): string | null {
  const { name } = parse(filename)
  
  if (requestedWidth) {
    const widths = [256, 512, 768, 1024]
    for (const w of widths) {
      if (w >= requestedWidth) {
        const variantName = `${name}_${w}.webp`
        const variantPath = resolve(uploadsDir, variantName)
        if (existsSync(variantPath)) {
          return variantName
        }
      }
    }
  }
  
  const webpName = `${name}.webp`
  const webpPath = resolve(uploadsDir, webpName)
  if (existsSync(webpPath)) {
    return webpName
  }
  
  return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const safe = sanitizeFilename(filename)
  if (!safe) return NextResponse.json({ ok: false }, { status: 400 })

  const uploadsDir = getUploadsRoot()
  
  const acceptHeader = request.headers.get('accept') || ''
  const acceptsWebp = acceptHeader.includes('image/webp')
  
  const widthParam = request.nextUrl.searchParams.get('w')
  const requestedWidth = widthParam ? parseInt(widthParam, 10) : null
  
  let fileToServe = safe
  
  const ext = safe.split('.').pop()?.toLowerCase()
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')
  
  if (isImage && acceptsWebp) {
    const webpVariant = tryFindWebPVariant(uploadsDir, safe, requestedWidth)
    if (webpVariant) {
      fileToServe = webpVariant
    }
  }

  const filePath = resolve(uploadsDir, fileToServe)
  const rel = relative(uploadsDir, filePath)
  if (rel.startsWith('..')) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    const data = await readFile(filePath)
    const servedExt = fileToServe.split('.').pop()?.toLowerCase() || ''
    const type = getContentType(servedExt)

    const view = new Uint8Array(data)
    const arrayBuffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
    const blob = new Blob([arrayBuffer], { type })

    const cacheControl = fileToServe !== safe 
      ? 'public, max-age=31536000, immutable'
      : 'no-store, max-age=0'

    return new NextResponse(blob, {
      headers: {
        'Content-Type': type,
        'Cache-Control': cacheControl,
        'Vary': 'Accept',
      },
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
}


