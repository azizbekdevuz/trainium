'use client';

import SmartImage from '../ui/media/SmartImage';

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
  badge?: React.ReactNode;
};

/** Single primary image only (catalog uses one image per product). */
export function ProductImageGallery({ images, alt, badge }: ProductImageGalleryProps) {
  const first =
    images
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .find((s) => s.length > 0) ?? '';

  if (!first) {
    return (
      <div className="relative flex min-h-[300px] w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-2xl border border-ui-subtle bg-ui-inset text-sm text-ui-faint dark:bg-ui-elevated lg:min-h-[min(72vh,640px)]">
        Image coming soon
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-h-[300px] w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-ui-subtle bg-ui-inset dark:bg-ui-elevated lg:aspect-auto lg:min-h-[min(72vh,640px)] lg:max-h-[800px]">
      {badge ? <div className="absolute right-3 top-3 z-[4] sm:right-4 sm:top-4">{badge}</div> : null}
      <SmartImage
        src={first}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 45vw, 600px"
        className="object-cover"
        priority
      />
    </div>
  );
}
