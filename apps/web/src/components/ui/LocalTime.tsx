'use client';

import { formatDateAndTimeLocal } from '@/lib/utils/date-utils';

/**
 * Renders a date/time in the user's local timezone.
 * Uses suppressHydrationWarning because server (UTC) and client (local) differ.
 */
export function LocalTime({ date }: { date: Date | string }) {
  return (
    <span suppressHydrationWarning>
      {formatDateAndTimeLocal(date)}
    </span>
  );
}
