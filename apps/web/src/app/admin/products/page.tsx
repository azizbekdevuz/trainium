import Link from 'next/link';
import { prisma } from '../../../lib/database/db';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';
import ProductsTable from '../../../components/admin/ProductsTable';
import ToastOnQuery from '../../../components/ui/feedback/ToastOnQuery';

export const dynamic = 'force-dynamic';

async function getData(q: string) {
  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
    : {};
  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { 
      inventory: true, 
      variants: true, 
      categories: true 
    },
  });
  return products;
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = (params?.q ?? '').trim();
  const products = await getData(q);
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <ToastOnQuery />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{dict.admin?.products?.title ?? 'Products'}</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">{dict.admin?.products?.subtitle ?? 'Manage catalog, pricing, inventory and variants.'}</p>
          </div>
          <Link href={`/${lang}/admin/products/new`} className="rounded-2xl px-4 py-2 bg-cyan-600 text-white hover:opacity-90 transition text-sm sm:text-base font-medium">{dict.admin?.products?.new ?? 'New product'}</Link>
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
            className="px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-medium"
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

        <form className="mt-4 sm:mt-6">
          <input 
            name="q" 
            defaultValue={q} 
            placeholder={dict.admin?.products?.searchPlaceholder ?? 'Search by name or slug'} 
            className="h-10 sm:h-11 w-full max-w-md rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
          />
        </form>

        <ProductsTable
          items={products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            priceCents: p.variants[0]?.priceCents ?? p.priceCents,
            currency: p.currency,
            variants: p.variants.length,
            stock: p.inventory?.inStock ?? 0,
            active: p.active,
            images: p.images,
          }))}
          dict={dict}
          lang={lang}
        />
      </div>
    </div>
  );
}


