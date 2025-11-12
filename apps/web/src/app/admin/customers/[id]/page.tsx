import { auth } from '../../../../auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '../../../../lib/database/db';
import Link from 'next/link';
import CustomerRoleEditor from '../../../../components/admin/CustomerRoleEditor';
import { negotiateLocale, getDictionary } from '../../../../lib/i18n/i18n';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!user) return notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{dict.admin?.customers?.detail?.title ?? 'Customer'}</h1>
          <p className="text-gray-600">{dict.admin?.customers?.detail?.subtitle ?? 'Manage customer profile and view activity.'}</p>
        </div>
        <Link href={`/${lang}/admin/customers`} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">{dict.admin?.customers?.detail?.back ?? '← Back'}</Link>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-3">{dict.admin?.customers?.detail?.profile ?? 'Profile'}</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{dict.admin?.customers?.detail?.name ?? 'Name'}</div>
            <div className="font-medium">{user.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{dict.admin?.customers?.detail?.email ?? 'Email'}</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">{dict.admin?.customers?.detail?.role ?? 'Role'}</div>
            <CustomerRoleEditor userId={user.id} initialRole={user.role as any} />
          </div>
          <div>
            <div className="text-gray-500">{dict.admin?.customers?.detail?.joined ?? 'Joined'}</div>
            <div className="font-medium">{user.createdAt.toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-500">{dict.admin?.customers?.detail?.orders ?? 'Orders'}</div>
            <div className="font-medium">{user._count.orders}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-3">{dict.admin?.customers?.detail?.recentOrders ?? 'Recent Orders'}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">{dict.admin?.customers?.detail?.thOrder ?? 'Order'}</th>
                <th className="px-4 py-2 text-left">{dict.admin?.customers?.detail?.thStatus ?? 'Status'}</th>
                <th className="px-4 py-2 text-left">{dict.admin?.customers?.detail?.thTotal ?? 'Total'}</th>
                <th className="px-4 py-2 text-left">{dict.admin?.customers?.detail?.thDate ?? 'Date'}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {user.orders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="px-4 py-2">{o.status}</td>
                  <td className="px-4 py-2">{(o.totalCents/100).toLocaleString(undefined, { style: 'currency', currency: o.currency })}</td>
                  <td className="px-4 py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/${lang}/admin/orders/${o.id}`} className="text-cyan-700 hover:underline">{dict.admin?.customers?.detail?.view ?? 'View'}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


