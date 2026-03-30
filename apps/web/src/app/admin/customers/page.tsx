import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/database/db';
import Link from 'next/link';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';
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
    <div className="bg-ui-inset dark:bg-ui-base">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ui-primary">{dict.admin?.customers?.title ?? 'Customers'}</h1>
            <p className="text-sm sm:text-base text-ui-muted dark:text-ui-faint mt-1">{dict.admin?.customers?.subtitle ?? 'Manage customer accounts, roles, and history.'}</p>
          </div>
        </div>

        {/* Search */}
        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <input 
            name="q" 
            defaultValue={q} 
            placeholder={dict.admin?.customers?.searchPlaceholder ?? 'Search by name or email'} 
            className="h-10 sm:h-11 w-full max-w-md rounded-xl border border-ui-default dark:border-ui-subtle px-3 text-sm sm:text-base glass-surface text-ui-primary placeholder:text-ui-faint dark:placeholder:text-ui-faint focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
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
            <div className="text-xs sm:text-sm text-ui-muted dark:text-ui-faint">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} customers
            </div>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/${lang}/admin/customers?${new URLSearchParams({ q, page: String(pagination.page - 1) })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-ui-default dark:border-ui-subtle rounded-lg hover:bg-ui-inset dark:hover:bg-ui-elevated text-ui-secondary transition-colors"
                >
                  Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/${lang}/admin/customers?${new URLSearchParams({ q, page: String(pagination.page + 1) })}`}
                  className="px-3 py-2 text-xs sm:text-sm border border-ui-default dark:border-ui-subtle rounded-lg hover:bg-ui-inset dark:hover:bg-ui-elevated text-ui-secondary transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

        {customers.length === 0 && (
          <div className="mt-6 sm:mt-8 text-center py-8 sm:py-12">
            <div className="text-ui-faint dark:text-ui-faint text-sm sm:text-base">No customers found.</div>
          </div>
        )}
      </div>
    </div>
  );
}


