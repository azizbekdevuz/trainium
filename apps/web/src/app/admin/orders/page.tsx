import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import Link from 'next/link';
import type { OrderStatus } from '../../../lib/order-status';
import { getDictionary, negotiateLocale } from '../../../lib/i18n';
import { OrdersTable } from '../../../components/admin/OrdersTable';

export const runtime = 'nodejs';

async function getOrders(searchParams: {
  status?: string;
  q?: string;
  page?: string;
}) {
  const { status, q, page = '1' } = searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = 20;
  const skip = (pageNum - 1) * pageSize;

  const where: any = {};
  
  if (status && status !== 'all') {
    where.status = status as OrderStatus;
  }
  
  if (q?.trim()) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { shipping: { fullName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: true,
        shipping: true,
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page: pageNum,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export default async function AdminOrdersPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ status?: string; q?: string; page?: string }> 
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const params = await searchParams;
  const { orders, pagination } = await getOrders(params || {});

  const statusOptions = [
    { value: 'all', label: dict.admin?.orders?.all ?? 'All Orders' },
    { value: 'PENDING', label: dict.admin?.orders?.pending ?? 'Pending' },
    { value: 'PAID', label: dict.admin?.orders?.paid ?? 'Paid' },
    { value: 'FULFILLING', label: dict.admin?.orders?.fulfilling ?? 'Fulfilling' },
    { value: 'SHIPPED', label: dict.admin?.orders?.shipped ?? 'Shipped' },
    { value: 'DELIVERED', label: dict.admin?.orders?.delivered ?? 'Delivered' },
    { value: 'CANCELED', label: dict.admin?.orders?.canceled ?? 'Canceled' },
    { value: 'REFUNDED', label: dict.admin?.orders?.refunded ?? 'Refunded' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{dict.admin?.orders?.title ?? 'Order Management'}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">{dict.admin?.orders?.subtitle ?? 'Manage orders, update status, and track fulfillment.'}</p>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {pagination.totalCount} {dict.admin?.orders?.total ?? 'total orders'}
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <Link 
            href={`/${lang}/admin/orders`} 
            className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-medium"
          >
            {dict.admin?.nav?.orders ?? 'Orders'}
          </Link>
          <Link
            href={`/${lang}/admin/products`} 
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.products ?? 'Products'}
          </Link>
          <Link
            href={`/${lang}/admin/customers`} 
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.customers ?? 'Customers'}
          </Link>
          <Link
            href={`/${lang}/admin/notifications`} 
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.notifications ?? 'Notifications'}
          </Link>
          <Link
            href={`/${lang}/admin/analytics`} 
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.analytics ?? 'Analytics'}
          </Link>
          <Link
            href={`/${lang}/admin/faq`} 
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            {dict.admin?.nav?.faq ?? 'FAQ'}
          </Link>
        </div>

        {/* Filters */}
        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input 
              name="q" 
              defaultValue={params?.q || ''} 
              placeholder={dict.admin?.orders?.searchPlaceholder ?? 'Search by order ID, customer email, name, or shipping name'} 
              className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
            />
          </div>
          <div>
            <select 
              name="status" 
              defaultValue={params?.status || 'all'} 
              className="h-10 sm:h-11 rounded-xl border border-slate-300 dark:border-slate-600 px-3 min-w-[120px] sm:min-w-[150px] text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="h-10 sm:h-11 px-4 sm:px-6 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition text-sm sm:text-base font-medium"
          >
            {dict.admin?.orders?.filter ?? 'Filter'}
          </button>
        </form>

        {/* Orders Table */}
        <OrdersTable orders={orders} dict={dict} lang={lang} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {dict.admin?.orders?.showingPrefix ?? 'Showing'} {((pagination.page - 1) * pagination.pageSize) + 1} {dict.admin?.orders?.to ?? 'to'} {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} {dict.admin?.orders?.of ?? 'of'} {pagination.totalCount} {dict.admin?.orders?.orders ?? 'orders'}
            </div>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Link 
                  href={`/${lang}/admin/orders?${new URLSearchParams({
                    ...params,
                    page: String(pagination.page - 1)
                  })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {dict.admin?.orders?.prev ?? 'Previous'}
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link 
                  href={`/${lang}/admin/orders?${new URLSearchParams({
                    ...params,
                    page: String(pagination.page + 1)
                  })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {dict.admin?.orders?.next ?? 'Next'}
                </Link>
              )}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="mt-6 sm:mt-8 text-center py-8 sm:py-12">
            <div className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">{dict.admin?.orders?.noResults ?? 'No orders found matching your criteria.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
