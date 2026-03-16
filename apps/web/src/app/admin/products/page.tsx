import Link from 'next/link';
import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '../../../components/admin/AdminNav';
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
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/auth/signin');
  }

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
        <div className="mt-4 sm:mt-6">
          <AdminNav lang={lang} dict={dict} activeSegment="products" />
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


