'use client';

import NextImage, { type ImageProps } from 'next/image';

interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  responsiveWidths?: number[];
}

function generateSrcSet(baseSrc: string, widths: number[]): string {
  return widths
    .map(w => `${baseSrc}?w=${w} ${w}w`)
    .join(', ');
}

export default function SmartImage(props: SmartImageProps) {
  const { src, unoptimized, sizes, responsiveWidths, ...rest } = props;
  const isLocalUpload = typeof src === 'string' && src.startsWith('/uploads/');
  
  if (isLocalUpload) {
    const defaultWidths = responsiveWidths || [256, 512, 768, 1024];
    const srcSet = generateSrcSet(src, defaultWidths);
    const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    
    return (
      <NextImage 
        {...rest} 
        src={src} 
        sizes={defaultSizes}
        unoptimized={true}
        loader={({ src: loaderSrc, width }) => `${loaderSrc}?w=${width}`}
      />
    );
  }
  
  return <NextImage {...rest} src={src} sizes={sizes} unoptimized={Boolean(unoptimized)} />;
}
