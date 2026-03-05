/**
 * Path safety utilities for file uploads and serving.
 * Extracted for testability and reuse.
 */

/**
 * Rejects path traversal and dangerous chars. Returns null if invalid.
 * Allows alphanumeric, hyphen, underscore, dot (for extensions).
 */
export function sanitizeFilename(filename: string): string | null {
  if (!filename || typeof filename !== 'string') return null;
  const trimmed = filename.trim();
  if (!trimmed) return null;
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) return null;
  return trimmed;
}
