'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/date-utils';
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
  shipping: {
    fullName: string | null;
    status: string | null;
  } | null;
  payments: Array<{
    status: string;
  }>;
}

interface OrdersTableProps {
  orders: Order[];
  dict: any;
  lang: string;
}

export function OrdersTable({ orders, dict, lang }: OrdersTableProps) {
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getShippingStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Preparing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (isMobile) {
    return (
      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
          const paymentStatus = order.payments[0]?.status || dict.admin?.orders?.notAvailable || 'N/A';
          const shippingStatus = order.shipping?.status || dict.admin?.orders?.notSet || 'Not set';
          
          return (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/${lang}/admin/orders/${order.id}`}
                      className="font-mono text-sm font-medium text-cyan-700 dark:text-cyan-400 hover:underline"
                    >
                      #{order.id.slice(0, 8).toUpperCase()}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(order.totalCents, order.currency)}
                    </p>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {order.user?.name || order.shipping?.fullName || dict.admin?.orders?.guest || 'Guest'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {order.user?.email || dict.admin?.orders?.noEmail || 'No email'}
                  </p>
                </div>
                
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">{dict.admin?.orders?.itemsLabel || 'Items'}:</span>
                    <span className="ml-1 font-medium text-slate-900 dark:text-slate-100">
                      {itemCount} {itemCount !== 1 ? (dict.admin?.orders?.itemsPlural ?? 'items') : (dict.admin?.orders?.items ?? 'item')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">{dict.admin?.orders?.dateLabel || 'Date'}:</span>
                    <span className="ml-1 font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
                
                {/* Status Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{dict.admin?.orders?.paymentLabel || 'Payment'}:</span>
                    <span className={`text-xs px-2 py-1 rounded ${getPaymentStatusColor(paymentStatus)}`}>
                      {paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{dict.admin?.orders?.shippingLabel || 'Shipping'}:</span>
                    <span className={`text-xs px-2 py-1 rounded ${getShippingStatusColor(shippingStatus)}`}>
                      {shippingStatus}
                    </span>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Link 
                    href={`/${lang}/admin/orders/${order.id}`}
                    className="inline-flex items-center text-sm text-cyan-700 dark:text-cyan-400 hover:underline"
                  >
                    {dict.admin?.orders?.manage ?? 'Manage'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thOrderId ?? 'Order ID'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thCustomer ?? 'Customer'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thStatus ?? 'Status'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thTotal ?? 'Total'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thItems ?? 'Items'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thDate ?? 'Date'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thPayment ?? 'Payment'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">{dict.admin?.orders?.thShipping ?? 'Shipping'}</th>
            <th className="px-3 sm:px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
            const paymentStatus = order.payments[0]?.status || dict.admin?.orders?.notAvailable || 'N/A';
            const shippingStatus = order.shipping?.status || dict.admin?.orders?.notSet || 'Not set';
            
            return (
              <tr key={order.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-3 sm:px-4 py-3">
                  <Link 
                    href={`/${lang}/admin/orders/${order.id}`}
                    className="font-mono text-xs text-cyan-700 dark:text-cyan-400 hover:underline"
                  >
                    {order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {order.user?.name || order.shipping?.fullName || dict.admin?.orders?.guest || 'Guest'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {order.user?.email || dict.admin?.orders?.noEmail || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  {formatCurrency(order.totalCents, order.currency)}
                </td>
                <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  {itemCount} {itemCount !== 1 ? (dict.admin?.orders?.itemsPlural ?? 'items') : (dict.admin?.orders?.items ?? 'item')}
                </td>
                <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${getPaymentStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${getShippingStatusColor(shippingStatus)}`}>
                    {shippingStatus}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-right">
                  <Link 
                    href={`/${lang}/admin/orders/${order.id}`}
                    className="text-cyan-700 dark:text-cyan-400 hover:underline text-xs sm:text-sm"
                  >
                    {dict.admin?.orders?.manage ?? 'Manage'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
