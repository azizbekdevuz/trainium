'use client';

import Link from 'next/link';
import CuteMascot from '../components/ui/CuteMascot';
import { useI18n } from '../components/providers/I18nProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, lang } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center" lang={lang}>
      <div className="mx-auto mb-6 inline-grid place-items-center text-rose-600 dark:text-rose-400">
        <CuteMascot className="h-24 w-24 sm:h-28 sm:w-28" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-100">
        {t('pages.error.title', 'Something went wrong')}
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        {t('pages.error.subtitle', 'An unexpected error occurred. You can try again or use the options below.')}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          {t('pages.error.retry', 'Try again')}
        </button>
        <Link
          href={`/${lang}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {t('pages.error.home', 'Go Home')}
        </Link>
        <Link
          href={`/${lang}/contact`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {t('pages.error.contact', 'Contact support')}
        </Link>
      </div>

      {process.env.NODE_ENV !== 'production' && error?.digest && (
        <div className="mt-6 text-xs text-slate-500">{error.digest}</div>
      )}
    </div>
  );
}


