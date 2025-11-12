'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { formatDate, formatTime } from '@/lib/utils/date-utils';
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Icon name="package" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
              {dict.admin?.dashboard?.recent?.orders || 'Recent Orders'}
            </h3>
          </div>
          <Link
            href={`/${lang}/admin/orders`}
            className="text-xs sm:text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors group-hover:translate-x-1 transform duration-200"
          >
            {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <div
                key={order.id}
                className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
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
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <Icon name={getStatusIcon(order.status) as any} className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-mono text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(order.totalCents, order.currency)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {order.user?.name || order.user?.email || dict.admin?.orders?.guestUser || 'Guest User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                    {order.items.length > 0 ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} ${dict.admin?.orders?.more || 'more'}` : ''}` : dict.admin?.orders?.noItems || 'No items'}
                  </p>
                  </div>
                  
                  {/* Date */}
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Icon name="package" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                {dict.admin?.dashboard?.noData || 'No orders found'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            <Icon name="package" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
            {dict.admin?.dashboard?.recent?.orders || 'Recent Orders'}
          </h3>
        </div>
        <Link
          href={`/${lang}/admin/orders`}
          className="text-xs sm:text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors group-hover:translate-x-1 transform duration-200"
        >
          {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group/item border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md hover:scale-[1.02] transform"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
                  <Icon name={getStatusIcon(order.status) as any} className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-mono text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                    {order.user?.name || order.user?.email || dict.admin?.orders?.guestUser || 'Guest User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                    {order.items.length > 0 ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} ${dict.admin?.orders?.more || 'more'}` : ''}` : dict.admin?.orders?.noItems || 'No items'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.totalCents, order.currency)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Icon name="package" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {dict.admin?.dashboard?.noData || 'No orders found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
