import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import Link from 'next/link';
import { getDictionary, negotiateLocale } from '../../../lib/i18n';
import { CustomersTable } from '../../../components/admin/CustomersTable';

export const runtime = 'nodejs';

async function getCustomers(q: string | undefined, page: number) {
  const pageSize = 20;
  const where: any = {};
  if (q && q.trim()) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [customers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        orders: {
          select: { id: true, totalCents: true, currency: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export default async function AdminCustomersPage({ searchParams }: { searchParams?: Promise<{ q?: string; page?: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const params = await searchParams;
  const q = (params?.q ?? '').trim();
  const page = Math.max(1, parseInt(params?.page ?? '1'));
  const { customers, pagination } = await getCustomers(q, page);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{dict.admin?.customers?.title ?? 'Customers'}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">{dict.admin?.customers?.subtitle ?? 'Manage customer accounts, roles, and history.'}</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <Link
            href={`/${lang}/admin/orders`}
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
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
            className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-medium"
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

        {/* Search */}
        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <input 
            name="q" 
            defaultValue={q} 
            placeholder={dict.admin?.customers?.searchPlaceholder ?? 'Search by name or email'} 
            className="h-10 sm:h-11 w-full max-w-md rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
          />
          <button 
            type="submit" 
            className="h-10 sm:h-11 px-4 sm:px-6 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition text-sm sm:text-base font-medium"
          >
            {dict.admin?.customers?.search ?? 'Search'}
          </button>
        </form>

        {/* Table */}
        <CustomersTable customers={customers} dict={dict} lang={lang} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} customers
            </div>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/${lang}/admin/customers?${new URLSearchParams({ q, page: String(pagination.page - 1) })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/${lang}/admin/customers?${new URLSearchParams({ q, page: String(pagination.page + 1) })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

        {customers.length === 0 && (
          <div className="mt-6 sm:mt-8 text-center py-8 sm:py-12">
            <div className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">No customers found.</div>
          </div>
        )}
      </div>
    </div>
  );
}


