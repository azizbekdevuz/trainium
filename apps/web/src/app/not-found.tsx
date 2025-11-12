import Link from 'next/link';
import { negotiateLocale, getDictionary } from '../lib/i18n/i18n';
import CuteMascot from '../components/ui/media/CuteMascot';

export const runtime = 'nodejs';

export default async function NotFound() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang as any);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="mx-auto mb-6 inline-grid place-items-center text-cyan-700 dark:text-cyan-400">
        <CuteMascot className="h-24 w-24 sm:h-28 sm:w-28" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-100">
        {dict.pages?.notFound?.title ?? 'Oops — page not found'}
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        {dict.pages?.notFound?.subtitle ?? "We couldn't find what you were looking for. Try one of the options below."}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {dict.pages?.notFound?.home ?? 'Go Home'}
        </Link>
        <Link
          href={`/${lang}/products`}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          {dict.pages?.notFound?.browse ?? 'Browse Products'}
        </Link>
        <Link
          href={`/${lang}/contact`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {dict.pages?.notFound?.contact ?? 'Contact us'}
        </Link>
      </div>

      <div className="mt-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <span>404</span>
        <span className="mx-2">•</span>
        <span>{dict.pages?.notFound?.brandName ?? 'Trainium'}</span>
      </div>
    </div>
  );
}


