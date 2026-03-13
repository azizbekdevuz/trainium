'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { NOTIFICATIONS_DB_UPDATED, dispatchNotificationsDbUpdated } from '../db-sync';

export interface UseDbNotificationsOptions {
  userId: string | undefined;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

/**
 * Unified DB notifications hook for bell and page.
 * - Fetches on mount, window focus, and NOTIFICATIONS_DB_UPDATED
 * - Always dispatches after mark-read so other surfaces refetch
 */
export function useDbNotifications({
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
}: UseDbNotificationsOptions) {
  const [dbNotifications, setDbNotifications] = useState<Notification[]>(initialNotifications);
  const [dbUnreadCount, setDbUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);

  const fetchDbNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const { notifications = [], unreadCount = 0 } = await res.json();
        setDbNotifications(notifications);
        setDbUnreadCount(unreadCount);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchDbNotifications();
  }, [userId, fetchDbNotifications]);

  useEffect(() => {
    const onFocus = () => fetchDbNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDbNotifications]);

  useEffect(() => {
    const handler = () => fetchDbNotifications();
    window.addEventListener(NOTIFICATIONS_DB_UPDATED, handler);
    return () => window.removeEventListener(NOTIFICATIONS_DB_UPDATED, handler);
  }, [fetchDbNotifications]);

  const markDbAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!userId || notificationIds.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds }),
        });
        if (res.ok) {
          setDbNotifications(prev =>
            prev.map(n => (notificationIds.includes(n.id) ? { ...n, read: true } : n))
          );
          setDbUnreadCount(c => Math.max(0, c - notificationIds.length));
          dispatchNotificationsDbUpdated();
        }
      } catch (e) {
        console.error('Failed to mark as read:', e);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const markAllDbAsRead = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setDbNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setDbUnreadCount(0);
        dispatchNotificationsDbUpdated();
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    dbNotifications,
    dbUnreadCount,
    loading,
    markDbAsRead,
    markAllDbAsRead,
    fetchDbNotifications,
  };
}
