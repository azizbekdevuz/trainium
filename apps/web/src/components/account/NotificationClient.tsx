'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { Pagination, type PaginationParams } from '../ui/navigation/Pagination';
import { useI18n } from '../providers/I18nProvider';
import { useDbNotifications } from './notifications/hooks/useDbNotifications';
import { ConnectionStatus } from './notifications/ConnectionStatus';
import { NotificationActionsBar } from './notifications/NotificationActionsBar';
import { NotificationItem } from './notifications/NotificationItem';
import type { Notification, PaginationData } from './notifications/types';

interface NotificationClientProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  pagination?: PaginationData;
  baseUrl?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}

export function NotificationClient({ 
  initialNotifications, 
  initialUnreadCount,
  pagination,
  baseUrl,
  searchParams = {}
}: NotificationClientProps) {
  const { data: session } = useSession();
  const { dict, lang } = useI18n();
  const [filter, setFilter] = useState<string>('all');
  
  // Use Socket.IO hook for real-time notifications
  const {
    isConnected,
    isConnecting,
    connectionError,
    notifications: socketNotifications,
    unreadCount: socketUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    connect,
  } = useSocket();
  
  // Database notifications state
  const {
    dbNotifications,
    dbUnreadCount,
    loading,
    markDbAsRead,
    markAllDbAsRead,
  } = useDbNotifications(initialNotifications, initialUnreadCount);

  // Combined notification management
  const handleMarkAsRead = (notificationIds: string[]) => {
    // Mark Socket.IO notifications as read
    notificationIds.forEach(id => {
      if (socketNotifications.some(n => n.id === id)) {
        markNotificationAsRead(id);
      }
    });
    
    // Mark database notifications as read
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

  const handleRetry = async () => {
    if (typeof window !== 'undefined') {
      await new Promise(r => setTimeout(r, 250));
    }
    try { 
      await connect(); 
    } catch { 
      // ignore connection errors 
    }
  };

  // Combine Socket.IO and database notifications with deduplication
  const allNotifications = useMemo(() => {
    const combined: Notification[] = [
      ...socketNotifications.map(notif => ({
        id: (notif as any).id,
        type: (notif as any).type,
        title: (notif as any).title,
        message: (notif as any).message,
        read: Boolean((notif as any).read),
        createdAt: (notif as any).timestamp || new Date().toISOString(),
        data: (notif as any).data as any,
      })) as unknown as Notification[],
      ...dbNotifications,
    ];

    // Group notifications by type, title, and timestamp (within 5 seconds)
    // But for PRODUCT_ALERT, also include productId to avoid hiding different products
    const grouped = new Map<string, typeof combined>();
    
    combined.forEach(notif => {
      let key = `${notif.type}-${notif.title}-${Math.floor(new Date(notif.createdAt).getTime() / 5000)}`;
      
      // For product alerts, include productId to distinguish different products
      if (notif.type === 'PRODUCT_ALERT' && notif.data?.productId) {
        key += `-${notif.data.productId}`;
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(notif);
    });

    // For each group, prefer database notification (more action buttons) over socket
    const deduplicated: typeof combined = [];
    
    grouped.forEach(group => {
      if (group.length === 1) {
        deduplicated.push(group[0]);
      } else {
        // Multiple notifications for same event - prefer database version
        // Heuristic: DB notifications have more action buttons; since we normalized away the 'source' flag,
        // prefer the one that contains richer data (has trackingNumber or orderId) else fallback to first.
        const dbLike = group.find(n => Boolean(n.data && (n.data as any).trackingNumber || (n.data as any).orderId));
        deduplicated.push(dbLike ?? group[0]);
      }
    });

    return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [socketNotifications, dbNotifications]);

  const totalUnreadCount = socketUnreadCount + dbUnreadCount;

  // Filter notifications based on selected type
  const filteredNotifications = filter === 'all' 
    ? allNotifications 
    : allNotifications.filter(n => n.type === filter);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ConnectionStatus
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        dict={dict}
        onRetry={handleRetry}
      />

      <NotificationActionsBar
        totalUnreadCount={totalUnreadCount}
        filter={filter}
        onFilterChange={setFilter}
        onMarkAllAsRead={handleMarkAllAsRead}
        loading={loading}
        dict={dict}
      />

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">{dict.notifications?.none ?? 'No notifications yet'}</h3>
          <p className="text-gray-600 dark:text-slate-300">
            {isConnected 
              ? (dict.notifications?.about ?? "We'll notify you about order updates, new products, and important announcements.")
              : (dict.notifications?.connecting ?? 'Connecting to real-time notifications...')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              lang={lang}
              dict={dict}
              userEmail={session?.user?.email}
              loading={loading}
              onMarkAsRead={(id) => handleMarkAsRead([id])}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && baseUrl && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            baseUrl={baseUrl}
            params={searchParams as PaginationParams}
            prevLabel={dict.userNotifications?.prev ?? 'Previous'}
            nextLabel={dict.userNotifications?.next ?? 'Next'}
            showPageNumbers={pagination.totalPages <= 10}
            maxVisiblePages={5}
            className="justify-center"
          />
        </div>
      )}

      {/* User Feedback about 30-day limit */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {dict.userNotifications?.thirtyDayLimit ?? 'Showing notifications from the last 30 days or since you signed up, whichever is more recent.'}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {dict.userNotifications?.cleanupInfo ?? 'Older notifications are automatically cleaned up to keep the system running smoothly.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
