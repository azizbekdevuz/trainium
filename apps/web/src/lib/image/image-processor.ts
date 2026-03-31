/**
 * New uploads store a single object; /uploads route still serves old siblings if present.
 */

import { parse } from 'path';

const VARIANT_SIZES = [
  { width: 256, suffix: '_256' },
  { width: 512, suffix: '_512' },
  { width: 768, suffix: '_768' },
  { width: 1024, suffix: '_1024' },
] as const;

function getVariantFilename(originalName: string, suffix: string, format: string): string {
  const { name } = parse(originalName);
  return `${name}${suffix}.${format}`;
}

/** Remove generated WebP variants for an original key (does not remove the original file). */
export async function cleanupVariants(
  originalFilename: string,
  del: (key: string) => Promise<void>
): Promise<void> {
  const { name } = parse(originalFilename);

  for (const variant of VARIANT_SIZES) {
    const webpFilename = getVariantFilename(originalFilename, variant.suffix, 'webp');
    try {
      await del(webpFilename);
    } catch {
      /* ignore */
    }
  }

  try {
    await del(`${name}.webp`);
  } catch {
    /* ignore */
  }
}
