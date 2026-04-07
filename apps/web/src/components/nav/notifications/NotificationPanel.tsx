import type { CSSProperties } from 'react';
import { X, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { LocalTime } from '../../ui/LocalTime';
import { translateNotification, getNotificationActions } from './utils';
import type { Notification } from '@/lib/notifications/types';
import type { Dictionary } from '../../../lib/i18n/i18n';
import { cn } from '@/lib/utils/format';

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
  /** When set, panel is `position:fixed` with this style (e.g. portaled to `document.body` above the nav). */
  fixedPanelStyle?: CSSProperties;
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
  fixedPanelStyle,
}: NotificationPanelProps) {
  const tr = (raw: string) => translateNotification(raw, dict);
  const portaled = Boolean(fixedPanelStyle);

  return (
    <>
      {/* Backdrop — higher z when portaled so panels sit above mobile nav utilities + header */}
      <div
        className={cn(
          'fixed inset-0 bg-black/5 dark:bg-black/20',
          portaled ? 'z-[199]' : 'z-[80]',
        )}
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div
        className={cn(
          'w-80 frosted-panel rounded-xl max-h-96 overflow-hidden shadow-lg',
          portaled ? 'fixed z-[200]' : 'absolute right-0 top-full z-[90] mt-2',
        )}
        style={fixedPanelStyle}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ui-primary">{dict.notifications?.bellTitle ?? 'Notifications'}</h3>
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
              className="text-xs text-accent hover:opacity-80"
            >
              {dict.notifications?.viewAll ?? 'View all'}
            </Link>
            {totalUnreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-accent hover:opacity-80"
              >
                {dict.notifications?.markAllRead ?? 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-ui-faint hover:text-ui-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-ui-faint dark:text-ui-faint text-sm">
              {isConnected ? (dict.notifications?.none ?? 'No notifications yet') : (dict.notifications?.connecting ?? 'Connecting to real-time notifications...')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-ui-inset dark:hover:bg-ui-elevated cursor-pointer ${!notification.read ? 'bg-blue-100/60 dark:bg-blue-950/30 border-l-3 border-l-blue-500 dark:border-l-blue-400' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      const ids = (notification as { id: string; _dedupIds?: string[] })._dedupIds ?? [notification.id];
                      onMarkAsRead(ids);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-ui-inset'}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${notification.read ? 'text-ui-primary dark:text-ui-faint' : 'text-ui-primary'}`}>
                        {tr(notification.title)}
                      </h4>
                      <p className={`text-sm mt-1 ${notification.read ? 'text-ui-muted dark:text-ui-faint' : 'text-ui-secondary dark:text-slate-100'}`}>
                        {tr(notification.message)}
                      </p>
                      <p className={`text-xs mt-1 ${notification.read ? 'text-ui-faint dark:text-ui-faint' : 'text-ui-faint dark:text-ui-faint'}`}>
                        <LocalTime date={notification.createdAt} />
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

        <div className="p-3 border-t bg-ui-inset dark:bg-ui-elevated">
          <Link
            href={`/${lang}/account/notifications`}
            onClick={onClose}
            className="block w-full text-sm text-accent hover:opacity-80 text-center"
          >
            {dict.notifications?.viewAllFooter ?? 'View all notifications'}
          </Link>
        </div>
      </div>
    </>
  );
}

