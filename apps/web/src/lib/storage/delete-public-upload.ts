import { cleanupVariants } from '@/lib/image/image-processor'
import type { PublicBlobStorage } from '@/lib/storage/blob-storage'
import { storageLog } from '@/lib/storage/storage-log'
import { uploadKeyFromPublicUrl } from '@/lib/storage/upload-paths'

/** Collect unique local `/uploads/` keys from product `images` JSON. */
export function keysFromProductImagesJson(images: unknown): string[] {
  const out = new Set<string>()
  if (!Array.isArray(images)) return []

  for (const item of images) {
    if (!item || typeof item !== 'object') continue
    const src = (item as { src?: unknown }).src
    if (typeof src !== 'string' || !src.trim()) continue
    const key = uploadKeyFromPublicUrl(src)
    if (key) out.add(key)
  }

  return [...out]
}

/** Best-effort: remove legacy WebP sidecars then the main object. Logs non-fatal failures. */
export async function deleteUploadKeyAndLegacyVariants(
  storage: PublicBlobStorage,
  key: string
): Promise<void> {
  try {
    await cleanupVariants(key, async (k) => {
      await storage.delete(k)
    })
    await storage.delete(key)
  } catch (e) {
    storageLog('warn', 'delete_upload_key_failed', {
      key,
      message: e instanceof Error ? e.message : 'unknown',
    })
  }
}
