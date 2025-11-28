'use client';
import Script from 'next/script';

export function UmamiAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

  // Only render the script if the website ID is set
  if (!websiteId) {
    return null;
  }

  // Umami Cloud uses cloud.umami.is; self-hosted uses your own domain
  const defaultUrl = 'https://cloud.umami.is/script.js';
  const src = scriptUrl || defaultUrl;

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
