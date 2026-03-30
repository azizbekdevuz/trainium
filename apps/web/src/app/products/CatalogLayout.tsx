'use client';

import { useState, useSyncExternalStore } from 'react';
import { ChevronsLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { BottomSheet } from '@/components/ui/navigation/bottom-sheet';

/** Matches Tailwind `lg` (1024px); must stay in sync with `BottomSheet` `sheetMediaQuery` below. */
const CATALOG_FILTER_SHEET_MQ = '(max-width: 1023px)';

function useCatalogNarrowViewport() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(CATALOG_FILTER_SHEET_MQ);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () =>
      typeof window === 'undefined' ? false : window.matchMedia(CATALOG_FILTER_SHEET_MQ).matches,
    () => false
  );
}

type CatalogLayoutProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  main: React.ReactNode;
  filtersLabel: string;
  closeLabel: string;
  /** Desktop: expand rail to show filters (e.g. screen reader + title) */
  sidebarExpandLabel: string;
  /** Desktop: collapse rail for wider product grid */
  sidebarCollapseLabel: string;
};

/**
 * Desktop (lg+): sticky filter rail + collapse control.
 * Below lg: filters live in a bottom sheet (shared `BottomSheet` with admin) so one overlay pattern;
 * form stays a single instance — in the hidden aside when the sheet is closed, in the sheet when open.
 */
export function CatalogLayout({
  children,
  header,
  main,
  filtersLabel,
  closeLabel,
  sidebarExpandLabel,
  sidebarCollapseLabel,
}: CatalogLayoutProps) {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const catalogNarrow = useCatalogNarrowViewport();

  /** Single filter form: sheet when narrow + open; sidebar when wide or narrow + closed */
  const filtersInSidebar = !open || !catalogNarrow;

  return (
    <div className="flex w-full flex-col lg:flex-row lg:items-stretch">
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={filtersLabel}
        desktopPresentation="none"
        sheetMediaQuery="(max-width: 1023px)"
        mobileRootClassName="z-[100]"
        closeButtonAriaLabel={closeLabel}
      >
        {open ? (
          <div className="min-w-0 [&_form]:shadow-none [&_form]:lg:shadow-none">{children}</div>
        ) : null}
      </BottomSheet>

      {/* Below lg: hidden layout column; keeps filter form mounted when the sheet is closed */}
      <aside
        id="catalog-shop-sidebar"
        className={cn(
          'flex flex-col border-ui-subtle glass-surface shadow-xl transition-[width,min-width] duration-200 ease-out',
          'max-lg:hidden',
          'lg:sticky lg:top-20 lg:z-30 lg:shrink-0 lg:self-start lg:border-y lg:border-r lg:border-l-0 lg:rounded-r-2xl lg:shadow-[var(--shadow-glass)]',
          sidebarCollapsed
            ? 'lg:min-h-[calc(100vh-5rem)] lg:w-14 lg:min-w-14 lg:max-w-14'
            : 'lg:min-h-[calc(100vh-5rem)] lg:w-[min(420px,32vw)] lg:min-w-[280px] lg:max-w-[440px]'
        )}
      >
        <div
          className={cn(
            'hidden border-b border-ui-subtle lg:flex',
            sidebarCollapsed ? 'flex-col items-center py-3' : 'items-center justify-between gap-2 px-3 py-2'
          )}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-ui-subtle bg-ui-elevated text-ui-primary shadow-sm transition hover:bg-ui-inset"
              aria-label={sidebarExpandLabel}
              aria-expanded={false}
              aria-controls="catalog-filters-panel"
            >
              <Menu className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
            </button>
          ) : (
            <>
              <span className="truncate text-sm font-semibold text-ui-primary">{filtersLabel}</span>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ui-subtle bg-ui-inset text-ui-primary transition hover:bg-ui-elevated"
                aria-label={sidebarCollapseLabel}
                aria-expanded={true}
                aria-controls="catalog-filters-panel"
              >
                <ChevronsLeft className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </button>
            </>
          )}
        </div>

        <div
          id="catalog-filters-panel"
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            sidebarCollapsed && 'lg:hidden'
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-2 lg:p-4 lg:pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ui-subtle">
            {filtersInSidebar ? children : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-4 sm:px-6 lg:pl-6 lg:pr-8">
        <div className="mb-4 flex items-start justify-between gap-3 lg:mb-6">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 shrink-0 rounded-2xl border border-ui-subtle bg-ui-elevated px-4 text-sm font-medium shadow-sm hover:bg-ui-inset lg:hidden"
          >
            {filtersLabel}
          </button>
        </div>
        {main}
      </div>
    </div>
  );
}
