'use client';

import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * Responsive Looker Studio (Google Data Studio) embed.
 * Swaps light/dark report URLs based on site theme; appends ?hl= for i18n.
 */
interface LookerStudioEmbedProps {
  lightReportUrl: string;
  darkReportUrl: string;
  /** Site language for Looker Studio UI (en, ko, uz). Appends ?hl= when not en. */
  lang?: string;
  /** Optional min height in px. Default: 1200 for tall dashboards */
  minHeight?: number;
}

export function LookerStudioEmbed({
  lightReportUrl,
  darkReportUrl,
  lang = 'en',
  minHeight = 1200,
}: LookerStudioEmbedProps) {
  const { theme } = useTheme();
  const baseUrl = theme === 'dark' ? darkReportUrl : lightReportUrl;
  const hlParam = lang && lang !== 'en' ? `?hl=${lang}` : '';
  const reportUrl = `${baseUrl}${hlParam}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-ui-default dark:border-ui-subtle glass-surface"
      style={{ minHeight }}
    >
      <iframe
        src={reportUrl}
        title="Visitor Analytics Dashboard"
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen
        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        loading="lazy"
      />
    </div>
  );
}
