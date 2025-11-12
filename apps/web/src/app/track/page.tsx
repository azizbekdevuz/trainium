import { Suspense } from 'react';
import { TrackingForm } from '../../components/shipping/TrackingForm';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';

export const runtime = 'nodejs';

export default async function TrackPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-4">{dict.track?.title ?? 'Track Your Package'}</h1>
        <p className="text-gray-600 dark:text-slate-400">{dict.track?.subtitle ?? 'Enter your tracking number and email to get real-time updates on your shipment.'}</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <TrackingForm />
      </Suspense>
    </div>
  );
}
