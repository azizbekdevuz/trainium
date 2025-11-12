'use client';

import NextImage, { type ImageProps } from 'next/image';

// Smart wrapper to bypass Next Image optimizer for freshly uploaded local files.
// This avoids the optimizer caching a 404 before the file is visible on disk.
export default function SmartImage(props: ImageProps) {
  const { src, unoptimized, ...rest } = props;
  const isLocalUpload = typeof src === 'string' && src.startsWith('/uploads/');
  // No cache-buster needed: /uploads is served with Cache-Control: no-store
  return <NextImage {...rest} src={src} unoptimized={Boolean(unoptimized) || isLocalUpload} />;
}


