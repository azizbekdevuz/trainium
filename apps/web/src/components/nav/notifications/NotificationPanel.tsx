import { X, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '../../../lib/date-utils';
import { translateNotification, getNotificationActions, deduplicateNotifications } from './utils';
import type { Notification } from './types';
import type { Dictionary } from '../../../lib/i18n';

interface NotificationPanelProps {
  notifications: Notification[];
  isConnected: boolean;
  totalUnreadCount: number;
  lang: string;
  dict: Dictionary;
  userEmail?: string | null;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  isConnected,
  totalUnreadCount,
  lang,
  dict,
  userEmail,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  const tr = (raw: string) => translateNotification(raw, dict);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80]"
        onClick={onClose}
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
              onClick={onClose}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {dict.notifications?.viewAll ?? 'View all'}
            </Link>
            {totalUnreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {dict.notifications?.markAllRead ?? 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
              {isConnected ? (dict.notifications?.none ?? 'No notifications yet') : (dict.notifications?.connecting ?? 'Connecting to real-time notifications...')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-slate-800/80 dark:border-l-2 dark:border-cyan-700' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead([notification.id]);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
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
                        {getNotificationActions(notification, lang, dict, userEmail)}
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
            onClick={onClose}
            className="block w-full text-sm text-blue-600 hover:text-blue-800 text-center"
          >
            {dict.notifications?.viewAllFooter ?? 'View all notifications'}
          </Link>
        </div>
      </div>
    </>
  );
}

