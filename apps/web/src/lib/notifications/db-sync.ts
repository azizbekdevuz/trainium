/**
 * Custom event to sync db notification read-state across bell and notifications page.
 */
export const NOTIFICATIONS_DB_UPDATED = 'notifications-db-updated';

export function dispatchNotificationsDbUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_DB_UPDATED));
  }
}
