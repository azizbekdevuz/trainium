'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, ExternalLink, ShoppingCart, Package, Wifi, WifiOff } from 'lucide-react';
import { formatDateTime } from '../../lib/date-utils';
import Link from 'next/link';
import { useSocket } from '../../hooks/useSocket';
import { useI18n } from '../providers/I18nProvider';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    productId?: string;
    productName?: string;
    orderStatus?: string;
    trackingNumber?: string;
    userEmail?: string | null;
    firstProductId?: string | null;
    firstProductSlug?: string | null;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export function NotificationBell() {
  const { data: session } = useSession();
  const { dict, lang } = useI18n();
  const tr = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return raw as any;
    if (!raw.startsWith('i18n.')) return raw;
    const [keyPath, ...params] = raw.split('|');
    const path = keyPath.replace(/^i18n\./, '');
    const getByPath = (obj: any, p: string): unknown => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), obj);
    const tpl = getByPath(dict, path);
    if (typeof tpl !== 'string') return raw;
    let templateStr: string = tpl;
    templateStr = templateStr.replace(/\{\{(\d+),\s*optional(?:,\s*prefix=\s*([^}|]+))?(?:\s*,\s*suffix=\s*([^}]+))?\s*\}\}/g, (_m: string, idxStr: string, pre?: string, suf?: string) => {
      const idx: number = Number(idxStr);
      const val = params[idx] ?? '';
      if (!val) return '';
      return `${pre ?? ''}${val}${suf ?? ''}`;
    });
    templateStr = templateStr.replace(/\{\{(\d+)\}\}/g, (_m: string, idxStr: string) => {
      const idx: number = Number(idxStr);
      return params[idx] ?? '';
    });
    return templateStr;
  };
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  // Use Socket.IO hook for real-time notifications
  const {
    isConnected,
    // isConnecting,
    // connectionError,
    notifications: socketNotifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    // clearNotifications,
  } = useSocket();

  // Combine Socket.IO notifications with database notifications
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [dbUnreadCount, setDbUnreadCount] = useState(0);

  // Fetch database notifications (for persistence and fallback)
  const fetchDbNotifications = async () => {
    if (!session?.user?.id) return;

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
  };

  // Refresh DB notifications when socket reconnects or window regains focus
  useEffect(() => {
    if (isConnected) {
      fetchDbNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    const onFocus = () => fetchDbNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark database notifications as read
  const markDbAsRead = async (notificationIds: string[]) => {
    if (!session?.user?.id || notificationIds.length === 0) return;

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

  // Mark all database notifications as read
  const markAllDbAsRead = async () => {
    if (!session?.user?.id) return;

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

  // Fetch database notifications on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchDbNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Combine Socket.IO and database notifications with deduplication
  const deduplicatedNotifications = useMemo(() => {
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
        // Multiple notifications for same event - prefer one with richer data
        const dbLike = group.find(n => Boolean(n.data && (n.data as any).trackingNumber || (n.data as any).orderId));
        deduplicated.push(dbLike ?? group[0]);
      }
    });

    return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [socketNotifications, dbNotifications]);

  const allNotifications = deduplicatedNotifications;

  const totalUnreadCount = unreadCount + dbUnreadCount;

  const getNotificationActions = (notification: Notification) => {
    const actions = [];
    const data = notification.data;

    switch (notification.type) {
      case 'ORDER_UPDATE':
        // Always show View Orders button for order updates
        actions.push(
          <Link
            key="view-orders"
            href={`/${lang}/account/orders`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            <Package className="h-3 w-3" />
            {dict.notifications?.actions?.orders ?? 'Orders'}
          </Link>
        );

        if (data?.orderId) {
          // Replace with specific order if we have the ID
          actions[0] = (
            <Link
              key="view-order"
              href={`/${lang}/account/orders/${data.orderId}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              <Package className="h-3 w-3" />
              {dict.notifications?.actions?.viewOrder ?? 'View Order'}
            </Link>
          );

          if (data?.orderStatus === 'SHIPPED' && data?.trackingNumber) {
            const userEmail = session?.user?.email || data.userEmail;
            const trackUrl = userEmail
              ? `/${lang}/track/${data.trackingNumber}?email=${userEmail}`
              : `/${lang}/track/`;

            actions.push(
              <Link
                key="track-order"
                href={trackUrl}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {dict.notifications?.actions?.track ?? 'Track'}
              </Link>
            );
          }

          if (data?.orderStatus === 'DELIVERED' && data?.firstProductSlug) {
            actions.push(
              <Link
                key="reorder"
                href={`/${lang}/products/${data.firstProductSlug}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
              >
                <ShoppingCart className="h-3 w-3" />
                {dict.notifications?.actions?.reorder ?? 'Reorder'}
              </Link>
            );
          }
        }
        break;

      case 'PRODUCT_ALERT':
        // Always show View Products button for product alerts
        actions.push(
          <Link
            key="view-products"
            href={`/${lang}/products`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.products ?? 'Products'}
          </Link>
        );

        if (data?.productSlug) {
          // Replace with specific product if we have the slug
          actions[0] = (
            <Link
              key="view-product"
              href={`/${lang}/products/${data.productSlug}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {dict.notifications?.actions?.view ?? 'View'}
            </Link>
          );

          if (notification.type === 'PRODUCT_ALERT' && data?.productName) {
            actions.push(
              <Link
                key="add-to-cart"
                href={`/${lang}/products/${data.productSlug}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
              >
                <ShoppingCart className="h-3 w-3" />
                {dict.notifications?.actions?.addToCart ?? 'Add to Cart'}
              </Link>
            );
          }
        }
        break;

      default:
        // Fallback for any other notification types
        actions.push(
          <Link
            key="view-account"
            href={`/${lang}/account`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.account ?? 'Account'}
          </Link>
        );
        break;
    }

    return actions;
  };

  if (!session?.user?.id) {
    return null;
  }

  // const unreadNotifications = allNotifications.filter(n => !n.read);

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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[80]"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border rounded-lg shadow-lg z-[90] max-h-96 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{dict.notifications?.bellTitle ?? 'Notifications'}</h3>
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${lang}/account/notifications`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {dict.notifications?.viewAll ?? 'View all'}
                </Link>
                {totalUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {dict.notifications?.markAllRead ?? 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                  {isConnected ? (dict.notifications?.none ?? 'No notifications yet') : (dict.notifications?.connecting ?? 'Connecting to real-time notifications...')}
                </div>
              ) : (
                <div className="divide-y">
                  {allNotifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-slate-800/80 dark:border-l-2 dark:border-cyan-700' : ''}`}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead([notification.id]);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${notification.read ? 'text-gray-900 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                            {tr(notification.title)}
                          </h4>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-gray-600 dark:text-slate-500' : 'text-gray-700 dark:text-slate-100'}`}>
                            {tr(notification.message)}
                          </p>
                          <p className={`text-xs mt-1 ${notification.read ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-300'}`}>
                            {formatDateTime(notification.createdAt)}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getNotificationActions(notification)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-gray-50 dark:bg-slate-800">
              <Link
                href={`/${lang}/account/notifications`}
                onClick={() => setIsOpen(false)}
                className="block w-full text-sm text-blue-600 hover:text-blue-800 text-center"
              >
                {dict.notifications?.viewAllFooter ?? 'View all notifications'}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
