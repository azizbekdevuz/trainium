'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 component
 * 
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID in your .env file to enable tracking.
 * Get your Measurement ID from: https://analytics.google.com
 *   1. Go to Admin → Data Streams → Web
 *   2. Create a stream for trainium.shop
 *   3. Copy the Measurement ID (starts with G-)
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Only render if measurement ID is configured
  if (!measurementId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GoogleAnalytics] NEXT_PUBLIC_GA_MEASUREMENT_ID not set, skipping analytics');
    }
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track custom events in Google Analytics
 * 
 * Usage:
 *   trackEvent('purchase', { value: 10000, currency: 'KRW' });
 *   trackEvent('add_to_cart', { item_id: 'product-123' });
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', eventName, eventParams);
  }
}
