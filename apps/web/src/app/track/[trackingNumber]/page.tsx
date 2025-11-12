import { Suspense } from 'react';
import { TrackingResults } from '../../../components/shipping/TrackingResults';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';

export const runtime = 'nodejs';

type Params = { params: Promise<{ trackingNumber: string }> };

export default async function TrackingResultsPage({ params }: Params) {
  const { trackingNumber } = await params;
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-4">{dict.track?.resultsTitle ?? 'Package Tracking'}</h1>
        <p className="text-gray-600 dark:text-slate-400">
          {dict.track?.resultsDesc ?? 'Real-time updates for tracking number'}: <span className="font-mono font-medium">{trackingNumber}</span>
        </p>
      </div>

      <Suspense fallback={
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-8">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-slate-400">{dict.track?.loading ?? 'Loading tracking information...'}</span>
          </div>
        </div>
      }>
        <TrackingResults trackingNumber={trackingNumber} />
      </Suspense>
    </div>
  );
}
