'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/media/Icon';
import { cn } from '@/lib/utils/format';

type NavProductSearchProps = {
  lang: string;
  placeholder: string;
  ariaLabel: string;
  /** Full-width mobile field vs desktop inline */
  variant?: 'desktop' | 'mobile';
  /** Tighter padding when nested in the sticky header strip */
  compact?: boolean;
  /** No outer padding — use inside nav “show more” utilities column */
  embeddedInNav?: boolean;
  id?: string;
};

/**
 * Site-wide shop search: GETs `/{lang}/products?q=…`. Other query params use page defaults.
 */
export function NavProductSearch({
  lang,
  placeholder,
  ariaLabel,
  variant = 'desktop',
  compact = false,
  embeddedInNav = false,
  id,
}: NavProductSearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onProducts = pathname?.includes('/products');
  const q = onProducts ? (searchParams.get('q') ?? '') : '';

  if (variant === 'mobile') {
    return (
      <form
        id={id}
        key={`${pathname}-${q}`}
        action={`/${lang}/products`}
        method="get"
        role="search"
        className={cn(
          embeddedInNav
            ? 'w-full max-w-full p-0'
            : compact
              ? 'px-3 pb-2 pt-1 sm:px-4'
              : 'px-4 pb-3 sm:px-6',
        )}
      >
        <div className="relative min-w-0">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-faint"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={placeholder}
            aria-label={ariaLabel}
            autoComplete="off"
            enterKeyHint="search"
            className={cn(
              'h-11 w-full min-w-0 rounded-xl border border-ui-subtle bg-ui-elevated py-2.5 pl-10 pr-3 text-[15px] text-ui-primary sm:h-10 sm:text-sm',
              'placeholder:text-ui-faint focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/25',
            )}
          />
        </div>
      </form>
    );
  }

  return (
    <form
      key={`${pathname}-${q}`}
      action={`/${lang}/products`}
      method="get"
      role="search"
      className="mx-4 hidden min-w-0 max-w-md flex-1 md:block lg:mx-6"
    >
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-faint"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            'h-9 w-full rounded-xl border border-ui-subtle bg-ui-elevated/70 py-1.5 pl-9 pr-3 text-[13px] text-ui-primary',
            'placeholder:text-ui-faint focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
          )}
        />
      </div>
    </form>
  );
}
