import Link from 'next/link';
import { negotiateLocale, getDictionary } from '../lib/i18n/i18n';
import CuteMascot from '../components/ui/media/CuteMascot';

export const runtime = 'nodejs';

export default async function NotFound() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang as any);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="glass-surface rounded-2xl border border-ui-default dark:border-ui-subtle p-8 sm:p-12">
        <div className="mx-auto mb-6 inline-grid place-items-center text-accent">
          <CuteMascot className="h-24 w-24 sm:h-28 sm:w-28" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ui-primary">
          {dict.pages?.notFound?.title ?? 'Oops — page not found'}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-ui-secondary dark:text-ui-muted">
          {dict.pages?.notFound?.subtitle ?? "We couldn't find what you were looking for. Try one of the options below."}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Link
            href={`/${lang}`}
            className="btn-ghost inline-flex items-center justify-center px-4 py-2 text-sm"
          >
            {dict.pages?.notFound?.home ?? 'Go Home'}
          </Link>
          <Link
            href={`/${lang}/products`}
            className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm"
          >
            {dict.pages?.notFound?.browse ?? 'Browse Products'}
          </Link>
          <Link
            href={`/${lang}/contact`}
            className="btn-ghost inline-flex items-center justify-center px-4 py-2 text-sm"
          >
            {dict.pages?.notFound?.contact ?? 'Contact us'}
          </Link>
        </div>

        <div className="mt-10 text-xs sm:text-sm text-ui-faint">
          <span>404</span>
          <span className="mx-2">•</span>
          <span>{dict.pages?.notFound?.brandName ?? 'Trainium'}</span>
        </div>
      </div>
    </div>
  );
}


