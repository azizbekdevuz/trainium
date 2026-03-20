'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { LocalTime } from '../ui/LocalTime';
import { useResponsive } from '../../hooks/useResponsive';
import { Icon } from '../ui/media/Icon';

interface Order {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  } | null;
  items: Array<{
    name: string;
    qty: number;
  }>;
}

interface RecentOrdersPreviewProps {
  orders: Order[];
  dict: any;
  lang: string;
}

export function RecentOrdersPreview({ orders, dict, lang }: RecentOrdersPreviewProps) {
  const { isMobile } = useResponsive();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'FULFILLING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'REFUNDED':
        return 'bg-ui-inset text-ui-primary dark:bg-[color-mix(in_srgb,var(--bg-inset)_30%,transparent)] dark:text-ui-faint';
      default:
        return 'bg-ui-inset text-ui-primary dark:bg-[color-mix(in_srgb,var(--bg-inset)_30%,transparent)] dark:text-ui-faint';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'clock';
      case 'PAID':
        return 'payment';
      case 'FULFILLING':
        return 'package';
      case 'SHIPPED':
        return 'truck';
      case 'DELIVERED':
        return 'success';
      case 'CANCELED':
        return 'error';
      case 'REFUNDED':
        return 'undo';
      default:
        return 'package';
    }
  };

  if (isMobile) {
    return (
      <div className="glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-lo))] text-[var(--on-accent-ink)] sm:h-10 sm:w-10">
              <Icon name="package" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-ui-primary">
              {dict.admin?.dashboard?.recent?.orders || 'Recent Orders'}
            </h3>
          </div>
          <Link
            href={`/${lang}/admin/orders`}
            className="text-accent text-xs font-medium transition-colors duration-200 hover:opacity-90 group-hover:translate-x-1 sm:text-sm"
          >
            {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <div
                key={order.id}
                className="p-3 sm:p-4 rounded-xl glass-surface border border-ui-default dark:border-ui-subtle hover:shadow-md transition-all duration-200"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                {/* Mobile Card Layout */}
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ui-inset sm:h-10 sm:w-10">
                        <Icon name={getStatusIcon(order.status) as any} className="w-4 h-4 sm:w-5 sm:h-5 text-ui-muted dark:text-ui-faint" />
                      </div>
                      <div>
                        <p className="font-mono text-xs sm:text-sm font-medium text-ui-primary">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-ui-primary">
                        {formatCurrency(order.totalCents, order.currency)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div>
                  <p className="text-sm text-ui-muted dark:text-ui-faint truncate">
                    {order.user?.name || order.user?.email || dict.admin?.orders?.guestUser || 'Guest User'}
                  </p>
                  <p className="text-xs text-ui-faint dark:text-ui-faint truncate">
                    {order.items.length > 0 ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} ${dict.admin?.orders?.more || 'more'}` : ''}` : dict.admin?.orders?.noItems || 'No items'}
                  </p>
                  </div>
                  
                  {/* Date */}
                  <div className="text-xs text-ui-faint dark:text-ui-faint">
                    <LocalTime date={order.createdAt} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-ui-inset dark:bg-ui-elevated flex items-center justify-center">
                <Icon name="package" className="w-6 h-6 sm:w-8 sm:h-8 text-ui-faint dark:text-ui-faint" />
              </div>
              <p className="text-sm sm:text-base text-ui-faint dark:text-ui-faint">
                {dict.admin?.dashboard?.noData || 'No orders found'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-lo))] text-[var(--on-accent-ink)] sm:h-10 sm:w-10">
            <Icon name="package" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-ui-primary">
            {dict.admin?.dashboard?.recent?.orders || 'Recent Orders'}
          </h3>
        </div>
        <Link
          href={`/${lang}/admin/orders`}
          className="text-accent text-xs font-medium transition-colors duration-200 hover:opacity-90 group-hover:translate-x-1 sm:text-sm"
        >
          {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl glass-surface border border-ui-default dark:border-ui-subtle hover:shadow-md hover:scale-[1.01] transition-all duration-200 group/item"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ui-inset transition-transform duration-200 group-hover/item:scale-110 sm:h-12 sm:w-12">
                  <Icon name={getStatusIcon(order.status) as any} className="w-5 h-5 sm:w-6 sm:h-6 text-ui-muted dark:text-ui-faint" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-mono text-xs sm:text-sm font-medium text-ui-primary">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ui-muted dark:text-ui-faint truncate">
                    {order.user?.name || order.user?.email || dict.admin?.orders?.guestUser || 'Guest User'}
                  </p>
                  <p className="text-xs text-ui-faint dark:text-ui-faint truncate">
                    {order.items.length > 0 ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} ${dict.admin?.orders?.more || 'more'}` : ''}` : dict.admin?.orders?.noItems || 'No items'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm sm:text-base font-semibold text-ui-primary">
                  {formatCurrency(order.totalCents, order.currency)}
                </p>
                <p className="text-xs text-ui-faint dark:text-ui-faint">
                  <LocalTime date={order.createdAt} />
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-ui-inset dark:bg-ui-elevated flex items-center justify-center">
              <Icon name="package" className="w-6 h-6 sm:w-8 sm:h-8 text-ui-faint dark:text-ui-faint" />
            </div>
            <p className="text-sm sm:text-base text-ui-faint dark:text-ui-faint">
              {dict.admin?.dashboard?.noData || 'No orders found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
