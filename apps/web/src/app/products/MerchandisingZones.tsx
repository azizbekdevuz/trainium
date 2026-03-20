import Link from 'next/link';
import { Icon } from '../../components/ui/media/Icon';
import type { Dictionary } from '../../lib/i18n/i18n';

interface MerchandisingZonesProps {
  lang: string;
  dict: Dictionary;
}

export function MerchandisingZones({ lang, dict }: MerchandisingZonesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href={`/${lang}/products?inStock=1&max=100000&sort=new`}
        className="group rounded-2xl border glass-surface p-5 hover:shadow-sm transition flex items-center justify-between"
      >
        <div>
          <div className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{dict.pages.products.hotDeals}</div>
          <div className="text-sm text-ui-secondary dark:text-ui-muted">{dict.pages.products.hotDealsDesc}</div>
        </div>
        <span className="text-xs text-ui-faint group-hover:text-ui-secondary dark:text-ui-muted dark:group-hover:text-ui-secondary">{dict.nav.shop} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" /></span>
      </Link>
      <Link
        href={`/${lang}/special-bargain`}
        className="group rounded-2xl border glass-surface p-5 hover:shadow-sm transition flex items-center justify-between"
      >
        <div>
          <div className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{dict.pages.products.cashback}</div>
          <div className="text-sm text-ui-secondary dark:text-ui-muted">{dict.pages.products.cashbackDesc}</div>
        </div>
        <span className="text-xs text-ui-faint group-hover:text-ui-secondary">{dict.pages.products.learnMore}</span>
      </Link>
    </div>
  );
}

