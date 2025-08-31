'use client';

interface ProductImageProps {
  images: any;
  name: string;
  className?: string;
}

export function ProductImage({ images, name, className = "w-12 h-12" }: ProductImageProps) {
  const productImages = Array.isArray(images) ? images : [];
  const firstImage = productImages.length > 0 ? productImages[0] : null;
  const imageSrc = firstImage?.src || null;
  
  return (
    <div className={`${className} rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0`}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-image.webp';
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/default-avatar.png"
          alt="No image"
          className="w-full h-full object-cover opacity-50"
        />
      )}
    </div>
  );
}
