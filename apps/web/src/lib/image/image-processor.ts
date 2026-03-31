/**
 * Server-side image processing utility
 * Generates responsive image variants (WebP + multiple sizes) on upload
 * Falls back gracefully if sharp is not available
 */

import { parse } from 'path';

export type UploadWriteFn = (filename: string, data: Buffer) => Promise<void>;

export interface ImageVariant {
  width: number;
  suffix: string;
}

export interface ProcessedImage {
  original: string;
  variants: Record<string, string>;
}

const VARIANT_SIZES: ImageVariant[] = [
  { width: 256, suffix: '_256' },
  { width: 512, suffix: '_512' },
  { width: 768, suffix: '_768' },
  { width: 1024, suffix: '_1024' },
];

const SUPPORTED_INPUT_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpModule: any = null;
let sharpLoadAttempted = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSharp(): Promise<any> {
  if (sharpLoadAttempted) return sharpModule;

  sharpLoadAttempted = true;
  try {
    const moduleName = 'sharp';
    sharpModule = (await import(/* webpackIgnore: true */ moduleName)).default;
    return sharpModule;
  } catch {
    console.warn('[ImageProcessor] sharp not available, image optimization disabled');
    return null;
  }
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? SUPPORTED_INPUT_FORMATS.includes(ext) : false;
}

function getVariantFilename(originalName: string, suffix: string, format: string): string {
  const { name } = parse(originalName);
  return `${name}${suffix}.${format}`;
}

export async function processUploadedImage(
  buffer: Buffer,
  originalFilename: string,
  writeOut: UploadWriteFn
): Promise<ProcessedImage> {
  const sharp = await getSharp();
  const { name, ext } = parse(originalFilename);
  const originalExt = ext.slice(1).toLowerCase();

  const result: ProcessedImage = {
    original: originalFilename,
    variants: {},
  };

  if (!isImageFile(originalFilename)) {
    await writeOut(originalFilename, buffer);
    return result;
  }

  await writeOut(originalFilename, buffer);

  if (!sharp) {
    return result;
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const originalWidth = metadata.width || 1024;

    for (const variant of VARIANT_SIZES) {
      if (variant.width >= originalWidth) continue;

      const webpFilename = getVariantFilename(originalFilename, variant.suffix, 'webp');

      try {
        const webpBuffer = await sharp(buffer)
          .resize(variant.width, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 80 })
          .toBuffer();

        await writeOut(webpFilename, webpBuffer);
        result.variants[`${variant.width}w`] = webpFilename;
      } catch (err) {
        console.warn(`[ImageProcessor] Failed to create variant ${variant.width}w:`, err);
      }
    }

    if (originalExt !== 'webp') {
      const webpOriginalFilename = `${name}.webp`;

      try {
        const webpBuf = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        await writeOut(webpOriginalFilename, webpBuf);
        result.variants['webp'] = webpOriginalFilename;
      } catch (err) {
        console.warn('[ImageProcessor] Failed to create WebP version:', err);
      }
    }
  } catch (err) {
    console.error('[ImageProcessor] Error processing image:', err);
  }

  return result;
}

export function selectBestVariant(
  variants: Record<string, string>,
  requestedWidth: number,
  acceptsWebp: boolean
): string | null {
  if (!variants || Object.keys(variants).length === 0) {
    return null;
  }

  if (acceptsWebp && variants['webp']) {
    const sortedWidths = Object.keys(variants)
      .filter((k) => k.endsWith('w'))
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    for (const width of sortedWidths) {
      if (width >= requestedWidth && variants[`${width}w`]) {
        return variants[`${width}w`];
      }
    }

    return variants['webp'];
  }

  return null;
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
