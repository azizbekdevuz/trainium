import { resolve, relative } from 'path';
import { sanitizeFilename } from '@/lib/utils/path-safety';

const UPLOADS_PUBLIC_PREFIX = '/uploads/';

/** Absolute path to `storage/uploads` for the Next app (uses `process.cwd()` by default). */
export function getUploadsRoot(cwd: string = process.cwd()): string {
  return resolve(cwd, 'storage', 'uploads');
}

/**
 * Maps a stored public URL (`/uploads/filename.ext`) to an absolute path under
 * `storage/uploads`. Returns null if the URL is not a local upload, the basename
 * is unsafe, or the result would escape the uploads directory.
 *
 * Avoids `path.join(cwd, 'storage', '/uploads/...')`, which on POSIX treats
 * `/uploads/...` as absolute and drops earlier segments.
 */
export function resolveLocalUploadFilePath(
  publicUrl: string,
  cwd: string = process.cwd()
): string | null {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  const trimmed = publicUrl.trim();
  if (!trimmed.startsWith(UPLOADS_PUBLIC_PREFIX)) return null;

  const withoutQuery = (trimmed.split('?')[0] ?? '').trim();
  const relativePart = withoutQuery.slice(UPLOADS_PUBLIC_PREFIX.length);
  const safe = sanitizeFilename(relativePart);
  if (!safe) return null;

  const uploadsDir = getUploadsRoot(cwd);
  const filePath = resolve(uploadsDir, safe);
  const rel = relative(uploadsDir, filePath);
  if (rel.startsWith('..') || rel === '') return null;

  return filePath;
}
