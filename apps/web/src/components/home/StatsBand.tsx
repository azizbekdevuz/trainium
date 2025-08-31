'use client';

import { useI18n } from '../providers/I18nProvider';

export default function StatsBand() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border bg-white dark:bg-[rgba(2,6,23,0.6)] p-6">
        <div>
          <div className="text-3xl font-display">{t('home.stats.onTimeValue')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('home.stats.onTimeLabel')}</div>
        </div>
        <div>
          <div className="text-3xl font-display">{t('home.stats.avgShippingValue')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('home.stats.avgShippingLabel')}</div>
        </div>
        <div>
          <div className="text-3xl font-display">{t('home.stats.happyCustomersValue')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('home.stats.happyCustomersLabel')}</div>
        </div>
      </div>
    </section>
  );
}


