'use client';

import Link from 'next/link';
import { LocalTime } from '../ui/LocalTime';
import { useResponsive } from '../../hooks/useResponsive';
import { UserAvatar } from './UserAvatar';
import { Icon } from '../ui/media/Icon';

interface Customer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: {
    orders: number;
  };
}

interface CustomersTableProps {
  customers: Customer[];
  dict: any;
  lang: string;
}

export function CustomersTable({ customers, dict, lang }: CustomersTableProps) {
  const { isMobile } = useResponsive();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'STAFF':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-ui-inset text-ui-secondary dark:bg-[color-mix(in_srgb,var(--bg-inset)_30%,transparent)] dark:text-ui-faint';
    }
  };

  if (isMobile) {
    return (
      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="glass-surface rounded-2xl border border-ui-default dark:border-ui-subtle p-4 hover:shadow-lg transition-all duration-200"
          >
            <div className="space-y-3">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar image={customer.image} name={customer.name} email={customer.email} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-ui-primary">
                      {customer.name ?? '—'}
                    </p>
                    <p className="text-xs text-ui-faint dark:text-ui-faint truncate max-w-[200px]">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(customer.role)}`}>
                  {customer.role}
                </span>
              </div>
              
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-ui-faint dark:text-ui-faint">{dict.admin?.customers?.ordersLabel || 'Orders'}:</span>
                  <span className="ml-1 font-medium text-ui-primary">
                    {customer._count.orders}
                  </span>
                </div>
                <div>
                  <span className="text-ui-faint dark:text-ui-faint">{dict.admin?.customers?.joinedLabel || 'Joined'}:</span>
                  <span className="ml-1 font-medium text-ui-primary">
                    <LocalTime date={customer.createdAt} />
                  </span>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="pt-2 border-t border-ui-default dark:border-ui-subtle">
                <Link 
                  href={`/${lang}/admin/customers/${customer.id}`}
                  className="inline-flex items-center text-sm text-cyan-700 dark:text-cyan-400 hover:underline"
                >
                  {dict.admin?.customers?.viewProfile ?? 'View Profile'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 overflow-x-auto rounded-2xl border border-ui-default dark:border-ui-subtle glass-surface">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-ui-inset dark:bg-ui-elevated">
          <tr>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thAvatar ?? 'Avatar'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thName ?? 'Name'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thEmail ?? 'Email'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thRole ?? 'Role'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thOrders ?? 'Orders'}</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium text-ui-primary">{dict.admin?.customers?.thJoined ?? 'Joined'}</th>
            <th className="px-3 sm:px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-ui-default dark:border-ui-subtle hover:bg-ui-inset dark:hover:bg-ui-elevated">
              <td className="px-3 sm:px-4 py-3">
                <UserAvatar image={customer.image} name={customer.name} email={customer.email} />
              </td>
              <td className="px-3 sm:px-4 py-3 text-ui-primary text-xs sm:text-sm">{customer.name ?? '—'}</td>
              <td className="px-3 sm:px-4 py-3 text-ui-secondary text-xs sm:text-sm">{customer.email}</td>
              <td className="px-3 sm:px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${getRoleColor(customer.role)}`}>{customer.role}</span>
              </td>
              <td className="px-3 sm:px-4 py-3 text-ui-primary text-xs sm:text-sm">{customer._count.orders}</td>
              <td className="px-3 sm:px-4 py-3 text-ui-muted dark:text-ui-faint text-xs sm:text-sm"><LocalTime date={customer.createdAt} /></td>
              <td className="px-3 sm:px-4 py-3 text-right">
                <Link 
                  href={`/${lang}/admin/customers/${customer.id}`}
                  className="text-cyan-700 dark:text-cyan-400 hover:underline text-xs sm:text-sm"
                >
                  {dict.admin?.customers?.viewProfile ?? 'View Profile'} <span className="ml-1">→</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
