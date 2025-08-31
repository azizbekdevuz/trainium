'use client';

import { useI18n } from '../providers/I18nProvider';
import { Star } from 'lucide-react';

export default function SocialProof() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-2xl border bg-white dark:bg-[rgba(2,6,23,0.6)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <div className="font-medium">{t('home.social.avgRating')}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('home.social.reviewsCount')}</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1">{t('home.social.trusted')}</span>
          <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1">{t('home.social.secure')}</span>
          <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1">{t('home.social.warranty')}</span>
        </div>
      </div>
    </section>
  );
}


