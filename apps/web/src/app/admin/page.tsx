import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDictionary, negotiateLocale } from '@/lib/i18n/i18n';
import { Icon } from '@/components/ui/media/Icon';
import { prisma } from '@/lib/database/db';
import Link from 'next/link';
import { DashboardStatsCards } from '@/components/admin/DashboardStatsCards';
import { RecentOrdersPreview } from '@/components/admin/RecentOrdersPreview';
import { RecentProductsPreview } from '@/components/admin/RecentProductsPreview';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    recentProducts,
    recentCustomers
  ] = await Promise.all([
    // Total orders count
    prisma.order.count(),
    
    // Total revenue from successful payments
    prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amountCents: true }
    }),
    
    // Total customers count
    prisma.user.count({
      where: { role: { not: 'ADMIN' } }
    }),
    
    // Total products count
    prisma.product.count(),
    
    // Pending orders count
    prisma.order.count({
      where: { status: 'PENDING' }
    }),
    
    // Low stock products count (assuming inventory with inStock < 10)
    prisma.product.count({
      where: {
        inventory: {
          inStock: { lt: 10 }
        }
      }
    }),
    
    // Recent orders (last 5)
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: { take: 1 }
      }
    }),
    
    // Recent products (last 5)
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        priceCents: true,
        currency: true,
        active: true,
        images: true
      }
    }),
    
    // Recent customers (last 5)
    prisma.user.findMany({
      take: 5,
      where: { role: { not: 'ADMIN' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } }
      }
    })
  ]);

  return {
    stats: {
      totalOrders,
      totalRevenue: totalRevenue._sum.amountCents || 0,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProducts
    },
    recent: {
      orders: recentOrders,
      products: recentProducts,
      customers: recentCustomers
    }
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const data = await getDashboardData();

  return (
    <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600/90 dark:text-cyan-400/80">
                {dict.common?.adminPanel || 'Admin panel'}
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ui-primary sm:text-3xl">
                {dict.admin?.dashboard?.title || 'Admin Dashboard'}
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-ui-muted dark:text-ui-faint sm:text-base">
                {dict.admin?.dashboard?.subtitle || "Here's what's happening with your business today"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-ui-subtle bg-ui-elevated px-3 py-1.5 text-xs font-medium text-ui-secondary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
                {dict.admin?.dashboard?.welcome || 'Welcome back'}, {session.user.name || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <DashboardStatsCards stats={data.stats} dict={dict} />

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <RecentOrdersPreview orders={data.recent.orders} dict={dict} lang={lang} />
          </div>
          <div className="lg:col-span-4">
            <QuickActionsPanel dict={dict} lang={lang} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <RecentProductsPreview products={data.recent.products} dict={dict} lang={lang} />
          </div>

          <div className="glass-surface rounded-2xl border border-ui-default p-4 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-ui-subtle sm:p-6 lg:col-span-7">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-ui-primary">
                {dict.admin?.dashboard?.recent?.customers || 'New Customers'}
              </h3>
              <Link
                href={`/${lang}/admin/customers`}
                className="text-xs sm:text-sm text-accent hover:opacity-80 font-medium transition-colors"
              >
                {dict.admin?.dashboard?.viewAll || 'View All'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
              </Link>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {data.recent.customers.length > 0 ? (
                data.recent.customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl glass-surface border border-ui-default dark:border-ui-subtle hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-lo))] flex items-center justify-center text-[var(--on-accent-ink)] font-semibold text-xs sm:text-sm flex-shrink-0">
                        {customer.name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ui-primary text-sm sm:text-base truncate">
                          {customer.name || 'Guest User'}
                        </p>
                        <p className="text-xs sm:text-sm text-ui-faint dark:text-ui-faint truncate">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs sm:text-sm font-medium text-ui-primary">
                        {customer._count.orders} {dict.admin?.dashboard?.recent?.ordersCount || 'orders'}
                      </p>
                      <p className="text-xs text-ui-faint dark:text-ui-faint">
                        {customer.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-ui-faint dark:text-ui-faint text-sm sm:text-base">
                  {dict.admin?.dashboard?.noData || 'No data available'}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
