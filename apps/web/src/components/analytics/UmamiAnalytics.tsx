'use client';
import Script from 'next/script';
import React from 'react';

export const UmamiAnalytics = () => {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

  // Only render the script if the website ID is set (e.g., in production)
  if (!websiteId) {
    return null;
  }

  const base = (scriptUrl || 'https://analytics.umami.is').replace(/\/+$/, '');
  const src = base.endsWith('/script.js') ? base : `${base}/script.js`;

  return (
    <Script
      async
      src={src}
      data-website-id={websiteId}
      // The afterInteractive strategy is suitable for most analytics scripts
      strategy="afterInteractive" 
    />
  );
};
