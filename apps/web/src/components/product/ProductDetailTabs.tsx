'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { cn } from '@/lib/utils/format';

export type ProductDetailTabsLabels = {
  description: string;
  summary: string;
  reviews: string;
  related: string;
};

type ProductDetailTabsProps = {
  labels: ProductDetailTabsLabels;
  descriptionPanel: React.ReactNode;
  summaryPanel: React.ReactNode;
  reviewsPanel: React.ReactNode;
  relatedPanel: React.ReactNode;
  /** If false, Summary tab is omitted */
  hasSummary: boolean;
  /** If false, Description tab is omitted */
  hasDescription: boolean;
  /** Related & recommended tab (always shown on PDP when this component is used with a panel) */
  showRelatedTab: boolean;
};

/** Fixed viewport-relative height so switching tabs does not shift the page layout; content scrolls inside. */
const PANEL_BOX =
  'h-[min(52vh,28rem)] sm:h-[min(56vh,32rem)] lg:h-[min(58vh,36rem)] overflow-y-auto overscroll-y-contain rounded-b-xl pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ui-subtle';

export function ProductDetailTabs({
  labels,
  descriptionPanel,
  summaryPanel,
  reviewsPanel,
  relatedPanel,
  hasSummary,
  hasDescription,
  showRelatedTab,
}: ProductDetailTabsProps) {
  const tabs: { key: string; label: string; content: React.ReactNode; show: boolean }[] = [
    { key: 'desc', label: labels.description, content: descriptionPanel, show: hasDescription },
    { key: 'sum', label: labels.summary, content: summaryPanel, show: hasSummary },
    { key: 'rev', label: labels.reviews, content: reviewsPanel, show: true },
    { key: 'rel', label: labels.related, content: relatedPanel, show: showRelatedTab },
  ];

  const visible = tabs.filter((t) => t.show);

  if (visible.length === 0) {
    return null;
  }

  return (
    <TabGroup defaultIndex={0}>
      <TabList
        className={cn(
          'flex min-h-[48px] gap-1 overflow-x-auto border-b border-ui-subtle pb-px [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2',
          '[&::-webkit-scrollbar]:hidden'
        )}
      >
        {visible.map((t) => (
          <Tab
            key={t.key}
            className={({ selected }) =>
              cn(
                'min-h-11 min-w-[44px] shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium outline-none transition sm:min-h-12 sm:px-5',
                'focus-visible:ring-2 focus-visible:ring-cyan-500/50',
                selected
                  ? 'border-b-2 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                  : 'text-ui-muted hover:text-ui-primary'
              )
            }
          >
            {t.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="mt-3 min-h-0">
        {visible.map((t) => (
          <TabPanel key={t.key} className={PANEL_BOX}>
            {t.content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
