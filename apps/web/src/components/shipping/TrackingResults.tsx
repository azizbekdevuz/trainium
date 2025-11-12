'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderTrackingTimeline } from '../order/OrderTrackingTimeline';
import { TrackingEvent } from '../../lib/order/shipping-tracker';
import { useI18n } from '../providers/I18nProvider';

interface TrackingResultsProps {
  trackingNumber: string;
}

export function TrackingResults({ trackingNumber }: TrackingResultsProps) {
  const { dict, lang } = useI18n();
  const [data, setData] = useState<{
    trackingNumber: string;
    carrier: string;
    carrierCode?: string;
    events: TrackingEvent[];
    lastUpdated: string;
    orderId?: string;
    orderStatus?: string;
    shippingStatus?: string;
    createdAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    fetchTrackingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumber, email]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shipping/track/${trackingNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tracking information');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-slate-400">{dict.track?.loading ?? 'Loading tracking information...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-8">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ {dict.track?.form?.failed ?? 'Failed to track package'}</div>
          <button 
            onClick={fetchTrackingData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {dict.common?.tryAgain ?? 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-8">
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          {dict.track?.noData ?? 'No tracking information found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracking Summary */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{dict.orderPage?.trackingNumber ?? 'Tracking Number'}</h3>
            <p className="font-mono text-lg">{data.trackingNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{dict.orderPage?.carrier ?? 'Carrier'}</h3>
            <p className="text-lg">{data.carrier}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{dict.track?.lastUpdated ?? 'Last Updated'}</h3>
            <p className="text-lg">{new Date(data.lastUpdated).toLocaleString(lang, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}</p>
          </div>
        </div>
      </div>

      {/* Order-Based Tracking Timeline */}
      {data.orderStatus && data.createdAt ? (
        <OrderTrackingTimeline
          orderStatus={data.orderStatus as any}
          shippingStatus={data.shippingStatus}
          trackingNo={data.trackingNumber}
          carrier={data.carrier}
          createdAt={new Date(data.createdAt)}
        />
      ) : (
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5">
          <h2 className="font-medium mb-4">{dict.track?.resultsTitle ?? 'Package Tracking'}</h2>
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            {dict.track?.noOrderInfo ?? 'No order information available for this tracking number.'}
          </div>
        </div>
      )}

      {/* Order Link */}
      {data.orderId && (
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">{dict.track?.orderDetailsTitle ?? 'Order Details'}</h3>
            <p className="text-gray-600 mb-4">
              {dict.track?.orderDetailsDesc ?? 'View complete order information and manage your shipment.'}
            </p>
            <a 
              href={`/${lang}/account/orders/${data.orderId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {dict.track?.viewOrderDetails ?? 'View Order Details'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
