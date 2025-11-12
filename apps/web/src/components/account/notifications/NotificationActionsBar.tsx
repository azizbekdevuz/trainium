import { Bell, CheckCheck } from 'lucide-react';
import type { Dictionary } from '../../../lib/i18n/i18n';

interface NotificationActionsBarProps {
  totalUnreadCount: number;
  filter: string;
  onFilterChange: (filter: string) => void;
  onMarkAllAsRead: () => void;
  loading: boolean;
  dict: Dictionary;
}

export function NotificationActionsBar({
  totalUnreadCount,
  filter,
  onFilterChange,
  onMarkAllAsRead,
  loading,
  dict,
}: NotificationActionsBarProps) {
  return (
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
          onChange={(e) => onFilterChange(e.target.value)}
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
          onClick={onMarkAllAsRead}
          disabled={loading}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 self-start sm:self-auto"
        >
          <CheckCheck className="h-4 w-4" />
          {dict.notifications?.markAllRead ?? 'Mark all read'}
        </button>
      )}
    </div>
  );
}

