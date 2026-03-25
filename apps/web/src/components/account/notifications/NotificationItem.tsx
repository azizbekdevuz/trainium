import { Check } from 'lucide-react';
import { LocalTime } from '../../ui/LocalTime';
import { getNotificationIcon, getNotificationColor, getNotificationActions, translateNotification } from './utils';
import type { Notification } from '@/lib/notifications/types';
import type { Dictionary } from '../../../lib/i18n/i18n';

interface NotificationItemProps {
  notification: Notification & { _dedupIds?: string[] };
  lang: string;
  dict: Dictionary;
  userEmail?: string | null;
  loading: boolean;
  onMarkAsRead: (ids: string[]) => void;
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
      className={`p-3 sm:p-4 rounded-lg transition-colors ${
        notification.read 
          ? 'glass-surface border border-ui-default' 
          : getNotificationColor(notification.type)
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl sm:text-2xl">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-medium text-sm sm:text-base ${notification.read ? 'text-ui-primary dark:text-ui-faint' : 'text-ui-primary'}`}>
                {tr(notification.title)}
              </h3>
              <p className={`mt-1 text-xs sm:text-sm ${notification.read ? 'text-ui-muted dark:text-ui-faint' : 'text-ui-secondary dark:text-slate-100'}`}>
                {tr(notification.message)}
              </p>
              <p className={`text-xs sm:text-sm mt-2 ${notification.read ? 'text-ui-faint dark:text-ui-faint' : 'text-ui-faint dark:text-ui-faint'}`}>
                <LocalTime date={notification.createdAt} />
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                {actions}
              </div>
            </div>
            
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification._dedupIds ?? [notification.id])}
                disabled={loading}
                className="ml-2 sm:ml-3 p-1 text-ui-faint hover:text-ui-muted dark:hover:text-slate-200 disabled:opacity-50"
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

