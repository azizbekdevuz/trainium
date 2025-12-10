'use client';

import { GoogleAnalytics as GoogleAnalyticsComponent } from '@next/third-parties/google';

/**
 * Google Analytics
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
            {/* Google Analytics */}
            <GoogleAnalyticsComponent gaId={measurementId} />
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
