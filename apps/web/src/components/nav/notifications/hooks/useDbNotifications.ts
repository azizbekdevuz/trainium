import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';

export function useDbNotifications(userId?: string) {
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [dbUnreadCount, setDbUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDbNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setDbNotifications(data.notifications || []);
        setDbUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch database notifications:', error);
    }
  }, [userId]);

  const markDbAsRead = async (notificationIds: string[]) => {
    if (!userId || notificationIds.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setDbNotifications(prev =>
          prev.map(notif =>
            notificationIds.includes(notif.id)
              ? { ...notif, read: true }
              : notif
          )
        );
        setDbUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Failed to mark database notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllDbAsRead = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setDbNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setDbUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all database notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDbNotifications();
    }
  }, [userId, fetchDbNotifications]);

  useEffect(() => {
    const onFocus = () => fetchDbNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDbNotifications]);

  return {
    dbNotifications,
    dbUnreadCount,
    loading,
    markDbAsRead,
    markAllDbAsRead,
    fetchDbNotifications,
  };
}

