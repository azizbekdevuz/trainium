/**
 * Server-side image processing utility
 * Generates responsive image variants (WebP + multiple sizes) on upload
 * Falls back gracefully if sharp is not available
 */

import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, parse } from 'path';

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
    // Dynamic import - sharp is optional, will fail gracefully if not installed
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
  uploadsDir: string
): Promise<ProcessedImage> {
  const sharp = await getSharp();
  const { name, ext } = parse(originalFilename);
  const originalExt = ext.slice(1).toLowerCase();
  
  const result: ProcessedImage = {
    original: originalFilename,
    variants: {},
  };

  if (!isImageFile(originalFilename)) {
    await writeFile(join(uploadsDir, originalFilename), buffer);
    return result;
  }

  await writeFile(join(uploadsDir, originalFilename), buffer);

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
      const webpPath = join(uploadsDir, webpFilename);

      try {
        await sharp(buffer)
          .resize(variant.width, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 80 })
          .toFile(webpPath);

        result.variants[`${variant.width}w`] = webpFilename;
      } catch (err) {
        console.warn(`[ImageProcessor] Failed to create variant ${variant.width}w:`, err);
      }
    }

    if (originalExt !== 'webp') {
      const webpOriginalFilename = `${name}.webp`;
      const webpOriginalPath = join(uploadsDir, webpOriginalFilename);
      
      try {
        await sharp(buffer)
          .webp({ quality: 85 })
          .toFile(webpOriginalPath);
        
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
      .filter(k => k.endsWith('w'))
      .map(k => parseInt(k))
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

export async function cleanupVariants(
  originalFilename: string,
  uploadsDir: string
): Promise<void> {
  const { name } = parse(originalFilename);
  
  for (const variant of VARIANT_SIZES) {
    const webpFilename = getVariantFilename(originalFilename, variant.suffix, 'webp');
    const webpPath = join(uploadsDir, webpFilename);
    
    try {
      if (existsSync(webpPath)) {
        await unlink(webpPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  const webpOriginalPath = join(uploadsDir, `${name}.webp`);
  try {
    if (existsSync(webpOriginalPath)) {
      await unlink(webpOriginalPath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
