'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, CheckCheck, ExternalLink, ShoppingCart, Package, Wifi, WifiOff } from 'lucide-react';
import { formatDateTime } from '../../lib/date-utils';
import Link from 'next/link';
import { useSocket } from '../../hooks/useSocket';
import { Pagination, type PaginationParams } from '../ui/Pagination';
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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

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
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  
  // Use Socket.IO hook for real-time notifications
  const {
    isConnected,
    isConnecting,
    connectionError,
    notifications: socketNotifications,
    unreadCount: socketUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    // clearNotifications,
    connect,
  } = useSocket();
  
  // Database notifications state
  const [dbNotifications, setDbNotifications] = useState(initialNotifications);
  const [dbUnreadCount, setDbUnreadCount] = useState(initialUnreadCount);

  // Mark database notifications as read
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

  // Mark all database notifications as read
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return '📦';
      case 'PRODUCT_ALERT':
        return '🔔';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return 'bg-blue-50 border-blue-200';
      case 'PRODUCT_ALERT':
        return 'bg-green-50 border-green-200';
      case 'SYSTEM_ALERT':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationActions = (notification: Notification) => {
    const actions = [] as React.ReactNode[];
    const data = notification.data;

    switch (notification.type) {
      case 'ORDER_UPDATE':
        actions.push(
          <Link
            key="view-orders"
            href={`/${lang}/account/orders`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="h-3 w-3" />
            {dict.notifications?.actions?.orders ?? 'View Orders'}
          </Link>
        );
        
        if (data?.orderId) {
          actions[0] = (
            <Link
              key="view-order"
              href={`/${lang}/account/orders/${data.orderId}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
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
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {dict.notifications?.actions?.track ?? 'Track Package'}
              </Link>
            );
          }
          
          if (data?.orderStatus === 'DELIVERED' && data?.firstProductSlug) {
            actions.push(
              <Link
                key="reorder"
                href={`/${lang}/products/${data.firstProductSlug}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ShoppingCart className="h-3 w-3" />
                {dict.notifications?.actions?.reorder ?? 'Reorder'}
              </Link>
            );
          }
        }
        break;

      case 'PRODUCT_ALERT':
        actions.push(
          <Link
            key="view-products"
            href={`/${lang}/products`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.products ?? 'Products'}
          </Link>
        );
        
        if (data?.productSlug) {
          actions[0] = (
            <Link
              key="view-product"
              href={`/${lang}/products/${data.productSlug}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {dict.notifications?.actions?.view ?? 'View'}
            </Link>
          );
          
          if (data?.productName && notification.title.includes('Low Stock')) {
            actions.push(
              <Link
                key="add-to-cart"
                href={`/${lang}/products/${data.productSlug}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
              >
                <ShoppingCart className="h-3 w-3" />
                {dict.notifications?.actions?.addToCart ?? 'Add to Cart'}
              </Link>
            );
          }
        }
        break;

      case 'SYSTEM_ALERT':
        actions.push(
          <Link
            key="learn-more"
            href={`/${lang}/about`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.view ?? 'View'}
          </Link>
        );
        break;
        
      default:
        actions.push(
          <Link
            key="view-account"
            href={`/${lang}/account`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.account ?? 'Account'}
          </Link>
        );
        break;
    }

    return actions;
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
  // const unreadNotifications = allNotifications.filter(n => !n.read);

  // Filter notifications based on selected type
  const filteredNotifications = filter === 'all' 
    ? allNotifications 
    : allNotifications.filter(n => n.type === filter);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-300 font-medium">{dict.notifications?.realtimeConnected ?? 'Real-time notifications connected'}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-300 font-medium">
                {isConnecting ? (dict.notifications?.connecting ?? 'Connecting...') : (dict.notifications?.realtimeOffline ?? 'Real-time notifications offline')}
              </span>
            </>
          )}
        </div>
        {!isConnected && (
          <button
            onClick={() => {
              (async () => {
                if (typeof window !== 'undefined') {
                  await new Promise(r => setTimeout(r, 250));
                }
                try { await connect(); } catch { /* ignore connection errors */ }
              })();
            }}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-100 self-start sm:self-auto"
          >
            {dict.notifications?.retry ?? 'Retry'}
          </button>
        )}
        {connectionError && (
          <span className="text-xs text-red-600">{connectionError}</span>
        )}
      </div>

      {/* Actions + Dynamic Unread Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-300 font-medium">
              {totalUnreadCount > 0
                ? `${totalUnreadCount} ${dict.notifications?.unread ?? 'unread notifications'}`
                : (dict.notifications?.allCaughtUp ?? 'All caught up!')}
            </span>
          </div>
          
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs sm:text-sm border border-gray-300 rounded px-2 sm:px-3 py-1 bg-white dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">{dict.notifications?.filters?.all ?? 'All Notifications'}</option>
            <option value="ORDER_UPDATE">{dict.notifications?.filters?.order ?? 'Order Updates'}</option>
            <option value="PRODUCT_ALERT">{dict.notifications?.filters?.product ?? 'Product Alerts'}</option>
            <option value="SYSTEM_ALERT">{dict.notifications?.filters?.system ?? 'System Alerts'}</option>
          </select>
        </div>
        
        {totalUnreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            {dict.notifications?.markAllRead ?? 'Mark all read'}
          </button>
        )}
      </div>

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
            <div
              key={notification.id}
              className={`p-3 sm:p-4 border rounded-lg transition-colors ${
                notification.read 
                  ? 'bg-white dark:bg-slate-900 border-gray-200' 
                  : `${getNotificationColor(notification.type)} dark:bg-slate-900 border-l-4 dark:border-l-4 dark:border-cyan-700`
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl sm:text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium text-sm sm:text-base ${notification.read ? 'text-gray-900 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                        {tr(notification.title)}
                      </h3>
                      <p className={`mt-1 text-xs sm:text-sm ${notification.read ? 'text-gray-600 dark:text-slate-500' : 'text-gray-700 dark:text-slate-100'}`}>
                        {tr(notification.message)}
                      </p>
                      <p className={`text-xs sm:text-sm mt-2 ${notification.read ? 'text-gray-500 dark:text-slate-500' : 'text-gray-500 dark:text-slate-300'}`}>
                        {formatDateTime(notification.createdAt)}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                        {getNotificationActions(notification)}
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead([notification.id])}
                        disabled={loading}
                        className="ml-2 sm:ml-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 disabled:opacity-50"
                        title={dict.notifications?.markAsRead ?? 'Mark as read'}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
