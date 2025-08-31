'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../providers/I18nProvider';

export function TrackingForm() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim() || !email.trim()) {
      setError(t('track.form.missing', 'Please enter both tracking number and email'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipping/track/${trackingNumber.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('track.form.failed', 'Failed to track package'));
      }

      // const data = await response.json();
      
      // Redirect to tracking results page
      router.push(`/track/${trackingNumber.trim()}?email=${encodeURIComponent(email.trim())}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('track.form.failed', 'Failed to track package'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
            {t('track.form.trackingNumber', 'Tracking Number')}
          </label>
          <input
            type="text"
            id="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder={t('track.form.trackingPlaceholder', 'Enter your tracking number')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('track.form.email', 'Email Address')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('track.form.emailPlaceholder', 'Enter your email address')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {t('track.form.tracking', 'Tracking...')}
            </div>
          ) : (
            t('track.form.submit', 'Track Package')
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('track.help.title', 'Need Help?')}</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• {t('track.help.t1', 'Make sure you enter the tracking number exactly as provided')}</p>
          <p>• {t('track.help.t2', 'Use the same email address used for your order')}</p>
          <p>• {t('track.help.t3', "Contact support if you're having trouble tracking your package")}</p>
        </div>
      </div>
    </div>
  );
}
