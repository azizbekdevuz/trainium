import { useState } from 'react';
import type { Notification } from '../types';

export function useDbNotifications(initialNotifications: Notification[], initialUnreadCount: number) {
  const [dbNotifications, setDbNotifications] = useState(initialNotifications);
  const [dbUnreadCount, setDbUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);

  const markDbAsRead = async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;

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
    if (dbUnreadCount === 0) return;

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

  return {
    dbNotifications,
    setDbNotifications,
    dbUnreadCount,
    loading,
    markDbAsRead,
    markAllDbAsRead,
  };
}

