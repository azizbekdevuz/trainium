import { Check } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils/date-utils';
import { getNotificationIcon, getNotificationColor, getNotificationActions, translateNotification } from './utils';
import type { Notification } from './types';
import type { Dictionary } from '../../../lib/i18n/i18n';

interface NotificationItemProps {
  notification: Notification;
  lang: string;
  dict: Dictionary;
  userEmail?: string | null;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({
  notification,
  lang,
  dict,
  userEmail,
  loading,
  onMarkAsRead,
}: NotificationItemProps) {
  const tr = (raw: string) => translateNotification(raw, dict);
  const actions = getNotificationActions(notification, lang, dict, userEmail);

  return (
    <div
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
                {actions}
              </div>
            </div>
            
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
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
  );
}

