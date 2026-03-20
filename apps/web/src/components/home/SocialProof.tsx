'use client';

import { useI18n } from '../providers/I18nProvider';
import { Star } from 'lucide-react';

export default function SocialProof() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="glass-surface rounded-2xl border border-[var(--border-default)] dark:bg-[rgba(2,6,23,0.6)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <div className="font-medium">{t('home.social.avgRating')}</div>
          <div className="text-sm text-ui-muted dark:text-ui-faint">{t('home.social.reviewsCount')}</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-ui-muted dark:text-ui-faint">
          <span className="rounded-full bg-ui-inset dark:bg-ui-elevated px-3 py-1">{t('home.social.trusted')}</span>
          <span className="rounded-full bg-ui-inset dark:bg-ui-elevated px-3 py-1">{t('home.social.secure')}</span>
          <span className="rounded-full bg-ui-inset dark:bg-ui-elevated px-3 py-1">{t('home.social.warranty')}</span>
        </div>
      </div>
    </section>
  );
}


