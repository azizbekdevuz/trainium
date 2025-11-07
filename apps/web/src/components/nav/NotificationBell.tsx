'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useI18n } from '../providers/I18nProvider';
import { useDbNotifications } from './notifications/hooks/useDbNotifications';
import { NotificationPanel } from './notifications/NotificationPanel';
import { deduplicateNotifications } from './notifications/utils';

export function NotificationBell() {
  const { data: session } = useSession();
  const { dict, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const {
    isConnected,
    notifications: socketNotifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocket();

  const {
    dbNotifications,
    dbUnreadCount,
    markDbAsRead,
    markAllDbAsRead,
    fetchDbNotifications,
  } = useDbNotifications(session?.user?.id);

  // Refresh DB notifications when socket reconnects
  useEffect(() => {
    if (isConnected) {
      fetchDbNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Combined notification management
  const handleMarkAsRead = (notificationIds: string[]) => {
    notificationIds.forEach(id => {
      if (socketNotifications.some(n => n.id === id)) {
        markNotificationAsRead(id);
      }
    });

    const dbIds = notificationIds.filter(id =>
      dbNotifications.some(n => n.id === id)
    );
    if (dbIds.length > 0) {
      markDbAsRead(dbIds);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    markAllDbAsRead();
  };

  // Combine Socket.IO and database notifications with deduplication
  const allNotifications = useMemo(() => {
    return deduplicateNotifications(socketNotifications, dbNotifications);
  }, [socketNotifications, dbNotifications]);

  const totalUnreadCount = unreadCount + dbUnreadCount;

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <div className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={allNotifications}
          isConnected={isConnected}
          totalUnreadCount={totalUnreadCount}
          lang={lang}
          dict={dict}
          userEmail={session?.user?.email}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
