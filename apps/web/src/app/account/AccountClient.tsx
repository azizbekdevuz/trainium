'use client';

import SmartImage from '../../components/ui/media/SmartImage';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '../../lib/utils/format';
import { getStatusConfig } from '../../lib/order/order-status';
import { useI18n } from '../../components/providers/I18nProvider';
import { LocalTime } from '../../components/ui/LocalTime';
import { Icon } from '../../components/ui/media/Icon';
import { BentoPanel } from '../../components/product/BentoPanel';
import { cn } from '@/lib/utils/format';
import type { OrderStatus } from '@prisma/client';

type OrderItemDTO = { id: string; name: string; sku: string | null; qty: number; priceCents: number };
type ShippingDTO = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  status: string | null;
  carrier: string | null;
  trackingNo: string | null;
};
type OrderDTO = {
  id: string;
  status: string;
  createdAt: string;
  totalCents: number;
  currency: string;
  items: OrderItemDTO[];
  shipping: ShippingDTO | null;
};
type CartItemDTO = {
  id: string;
  qty: number;
  priceCents: number;
  product: { id: string; name: string };
  variant: { id: string | null; name: string } | null;
};
type CartDTO = { id: string; items: CartItemDTO[] };

type DataProps = {
  sessionUser: { name: string | null; email: string | null; image: string | null };
  orders: OrderDTO[];
  activeCart: CartDTO | null;
};

const toHttps = (url?: string | null) =>
  url?.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url ?? null;

function orderLabelShort(id: string, t: (k: string, f: string) => string) {
  const short = id.includes('_') ? id.slice(-6) : id.slice(0, 8);
  return `${t('account.order', 'Order')} ${short.toUpperCase()}`;
}

export default function AccountClient({ data }: { data: DataProps }) {
  const { sessionUser, orders, activeCart } = data;
  const [editorOpen, setEditorOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string | null; image: string | null }>({
    name: sessionUser.name,
    image: sessionUser.image,
  });
  const { t, lang } = useI18n();
  const AccountProfileEditor = useMemo(
    () => dynamic(() => import('../../components/account/AccountProfileEditor'), { ssr: false }),
    [],
  );

  const activeCartTotal = useMemo(() => {
    if (!activeCart) return 0;
    return activeCart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
  }, [activeCart]);

  const hasTrackableOrders = useMemo(() => {
    if (!orders.length) return false;
    const trackableStatuses = ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'];
    return orders.some((order) => trackableStatuses.includes(order.status));
  }, [orders]);

  const totalSpent = useMemo(
    () => orders.reduce((s, o) => s + o.totalCents, 0),
    [orders],
  );

  /* eslint-disable-next-line */
  const loyaltyPoints = useMemo(
    () => Math.min(9999, orders.length * 60 + Math.floor(totalSpent / 500_000)),
    [orders.length, totalSpent],
  );

  const recentActivity = useMemo(() => {
    return orders.slice(0, 4).map((o, i) => {
      const cfg = getStatusConfig(o.status as OrderStatus);
      const isDelivered = o.status === 'DELIVERED';
      return {
        id: o.id,
        icon: isDelivered ? ('check' as const) : i % 2 === 0 ? ('package' as const) : ('star' as const),
        tone: isDelivered ? 'emerald' : i % 2 === 0 ? 'amber' : 'cyan',
        text: `${orderLabelShort(o.id, t)} · ${cfg.label}`,
        sub: <LocalTime date={o.createdAt} />,
      };
    });
  }, [orders, t]);

  const avatar = toHttps(localUser.image ?? sessionUser.image) || '/images/default-avatar.png';

  return (
    <div className="mx-auto max-w-7xl animate-fade px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 animate-fade-up">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em]"
          style={{
            background: 'var(--hero-bento-pill, color-mix(in srgb, var(--accent) 14%, var(--bg-elevated)))',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border-default))',
            color: 'color-mix(in srgb, var(--accent) 78%, var(--text-primary))',
          }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
          {t('account.sectionLabel', 'Your account')}
        </div>
      </header>

      <BentoPanel className="mb-6 overflow-hidden p-0 sm:mb-8 lg:p-5">
        <div className="flex flex-col gap-0 max-lg:gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Identity: nested bento tile on mobile; flat row on lg+ */}
          <div
            className={cn(
              'flex min-w-0 items-center gap-4 p-4 sm:p-5',
              'max-lg:mx-3 max-lg:mt-3 max-lg:rounded-2xl max-lg:border max-lg:border-ui-subtle/80',
              'max-lg:bg-gradient-to-br max-lg:from-ui-inset/90 max-lg:to-ui-elevated/50 max-lg:ring-1 max-lg:ring-inset max-lg:ring-ui-subtle/50',
              'dark:max-lg:from-ui-inset/50 dark:max-lg:to-ui-elevated/30',
              'lg:m-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:ring-0 lg:from-transparent lg:to-transparent',
            )}
          >
            <div className="relative shrink-0">
              <SmartImage
                src={avatar}
                alt={sessionUser.name || t('account.userAvatar', 'User Avatar')}
                width={72}
                height={72}
                className="relative z-10 h-[4.25rem] w-[4.25rem] rounded-full sm:h-[72px] sm:w-[72px] lg:h-[72px] lg:w-[72px]"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)' }}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[1.35rem] font-extrabold leading-tight tracking-tight text-ui-primary sm:text-2xl">
                {t('account.greeting', 'Hi, ')}
                <span className="break-words">{localUser.name || t('account.user', 'User')}</span>
              </h1>
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-ui-muted sm:text-base lg:truncate lg:line-clamp-none">
                {sessionUser.email ?? '—'}
              </p>
            </div>
          </div>

          {/* Actions: stacked bento rows on mobile; inline wrap on lg+ */}
          <div
            className={cn(
              'flex flex-col gap-2 p-4 pt-2 sm:gap-2.5 sm:p-5 sm:pt-3',
              'lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-2 lg:p-0 lg:pt-0',
            )}
          >
            <div className="flex gap-2 lg:contents">
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="btn-ghost inline-flex h-11 min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium sm:px-4 lg:h-10 lg:min-h-0 lg:flex-none"
              >
                <Icon name="user" className="h-4 w-4 shrink-0" />{' '}
                <span className="truncate">{t('account.profile.edit', 'Edit profile')}</span>
              </button>
              <Link
                href={`/${lang}/account/notifications`}
                className="btn-ghost inline-flex h-11 min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium sm:px-4 lg:h-10 lg:min-h-0 lg:flex-none"
              >
                <Icon name="bell" className="h-4 w-4 shrink-0" />{' '}
                <span className="truncate">{t('account.notifications', 'Notifications')}</span>
              </Link>
            </div>
            {hasTrackableOrders ? (
              <Link
                href={`/${lang}/track`}
                className="btn-primary inline-flex h-11 w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold lg:h-10 lg:min-h-0 lg:w-auto"
              >
                <Icon name="package" className="h-4 w-4 shrink-0" />
                <span className="truncate">{t('account.trackCta', 'Track Your Order')}</span>
              </Link>
            ) : null}
            <Link
              href={`/${lang}/favourites`}
              className={cn(
                'relative inline-flex h-11 w-full min-h-[2.75rem] items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold shadow-sm transition lg:h-10 lg:min-h-0 lg:w-auto',
                'border-2 border-pink-500/55 bg-gradient-to-br from-pink-500/20 via-rose-500/12 to-fuchsia-500/15',
                'text-pink-800 ring-1 ring-pink-500/25 ring-offset-2 ring-offset-[var(--bg-elevated)]',
                'hover:border-pink-500/70 hover:from-pink-500/28 hover:shadow-md',
                'dark:border-pink-400/45 dark:from-pink-500/25 dark:via-rose-500/18 dark:to-fuchsia-500/20',
                'dark:text-pink-100 dark:ring-pink-400/30 dark:ring-offset-[var(--bg-elevated)]',
                'dark:hover:border-pink-300/55',
              )}
            >
              <Icon name="star" className="h-4 w-4 shrink-0 text-pink-600 dark:text-pink-200" aria-hidden />
              <span className="truncate">{t('favorites.title', 'Favorites')}</span>
            </Link>
          </div>
        </div>
      </BentoPanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <section className="lg:col-span-8">
          <BentoPanel className="min-h-0 p-0 sm:p-0">
            <div className="flex items-center justify-between border-b border-ui-subtle px-4 py-4 sm:px-5">
              <h2 className="font-display text-lg font-bold text-ui-primary sm:text-xl">
                {t('account.orderHistory', 'Order History')}
              </h2>
              {orders.length > 0 ? (
                <Link
                  href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`}
                  className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  {t('account.shopMore', 'Shop more →')}
                </Link>
              ) : null}
            </div>
            {orders.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ui-subtle text-[10px] font-bold uppercase tracking-[0.12em] text-ui-faint">
                        <th className="px-4 py-3 sm:px-5">{t('account.order', 'Order')}</th>
                        <th className="px-4 py-3 sm:px-5">{t('account.table.status', 'Status')}</th>
                        <th className="px-4 py-3 sm:px-5">{t('account.total', 'Total')}</th>
                        <th className="px-4 py-3 sm:px-5">{t('account.table.date', 'Date')}</th>
                        <th className="px-4 py-3 sm:px-5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-subtle/80">
                      {orders.map((o) => {
                        const st = getStatusConfig(o.status as OrderStatus);
                        const ordersDict: unknown = t('admin.orders') as unknown;
                        const label =
                          (ordersDict as Record<string, string>)?.[o.status.toLowerCase()] ?? st.label;
                        return (
                          <tr key={o.id} className="transition hover:bg-ui-inset/60">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 sm:px-5">
                              {orderLabelShort(o.id, t)}
                            </td>
                            <td className="px-4 py-3 sm:px-5">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                  st.color,
                                )}
                              >
                                {label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-ui-primary sm:px-5">
                              {formatCurrency(o.totalCents, o.currency)}
                            </td>
                            <td className="px-4 py-3 text-xs text-ui-muted sm:px-5">
                              <LocalTime date={o.createdAt} />
                            </td>
                            <td className="px-4 py-3 text-right sm:px-5">
                              <Link
                                href={`/${lang}/account/orders/${o.id}`}
                                className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                              >
                                {t('account.manage', 'Manage')}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-ui-subtle md:hidden">
                  {orders.map((o, i) => (
                    <li
                      key={o.id}
                      className="animate-fade-up px-4 py-3"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/${lang}/account/orders/${o.id}`}
                        className="flex w-full items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ui-primary">
                            {orderLabelShort(o.id, t)}
                          </div>
                          <div className="text-xs text-ui-muted">
                            <LocalTime date={o.createdAt} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ui-primary">
                            {formatCurrency(o.totalCents, o.currency)}
                          </div>
                          <div
                            className={cn(
                              'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              getStatusConfig(o.status as OrderStatus).color,
                            )}
                          >
                            {(t('admin.orders') as unknown as Record<string, string>)?.[o.status.toLowerCase()] ??
                              getStatusConfig(o.status as OrderStatus).label}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-ui-muted sm:px-5">
                {t('account.noOrders', 'No orders yet.')}
              </p>
            )}
          </BentoPanel>
        </section>

        <div className="flex flex-col gap-5 lg:col-span-4">
          <BentoPanel>
            <h2 className="font-display text-base font-bold text-ui-primary sm:text-lg">
              {t('account.activeCart', 'Active Cart')}
            </h2>
            {activeCart ? (
              <>
                <ul className="mt-4 space-y-3 text-sm">
                  {activeCart.items.map((it) => (
                    <li key={it.id} className="flex items-start justify-between gap-2 border-b border-ui-subtle/60 pb-3 last:border-0">
                      <span className="min-w-0 flex-1 text-ui-primary">
                        {it.product.name}
                        {it.variant ? ` (${it.variant.name})` : ''}
                      </span>
                      <span className="shrink-0 font-medium text-cyan-600 dark:text-cyan-400">×{it.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-ui-subtle pt-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-ui-faint">
                    {t('account.total', 'Total')}
                  </span>
                  <span className="text-lg font-bold text-ui-primary">{formatCurrency(activeCartTotal)}</span>
                </div>
                <Link
                  href={`/${lang}/cart`}
                  className="btn-primary mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                >
                  {t('account.checkoutCta', 'Checkout')}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-ui-faint">{t('account.emptyCart', 'Your cart is empty.')}</p>
            )}
          </BentoPanel>

          <BentoPanel>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600/90 dark:text-cyan-400/90">
              {t('account.statsTitle', 'Your stats')}
            </p>
            <dl className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-ui-muted">{t('account.statsOrders', 'Orders placed')}</dt>
                <dd className="text-lg font-bold text-cyan-600 tabular-nums dark:text-cyan-400">{orders.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-ui-muted">{t('account.statsSpent', 'Total spent')}</dt>
                <dd className="text-lg font-bold text-cyan-600 tabular-nums dark:text-cyan-400">
                  {formatCurrency(totalSpent)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-ui-muted">{t('account.statsLoyalty', 'Loyalty points')}</dt>
                {/* <dd className="text-lg font-bold text-cyan-600 tabular-nums dark:text-cyan-400">{loyaltyPoints}</dd> */}
                {/* TODO: Uncomment above and replace with real data after full implementation of loyalty points */}
                <dd className="text-lg font-bold text-cyan-600 tabular-nums dark:text-cyan-400">{t('home.comingSoon.title', 'Coming Soon')}</dd>
              </div>
            </dl>
          </BentoPanel>

          <BentoPanel>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ui-faint">
              {t('account.recentActivity', 'Recent')}
            </p>
            {recentActivity.length ? (
              <ul className="mt-4 space-y-3">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex gap-3 rounded-xl border border-ui-subtle/50 bg-ui-inset/40 p-3 dark:bg-ui-elevated/30">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        a.tone === 'emerald' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                        a.tone === 'amber' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                        a.tone === 'cyan' && 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
                      )}
                    >
                      <Icon name={a.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ui-primary">{a.text}</p>
                      <p className="mt-0.5 text-xs text-ui-faint">{a.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ui-faint">{t('account.noActivity', 'No recent activity yet.')}</p>
            )}
          </BentoPanel>
        </div>
      </div>

      {editorOpen && (
        <AccountProfileEditor
          initialName={localUser.name}
          initialImage={localUser.image}
          initialEmail={(data as { sessionUser?: { email?: string | null } }).sessionUser?.email ?? null}
          onUpdated={(u) => setLocalUser(u)}
          onClose={() => setEditorOpen(false)}
        />
      )}

    </div>
  );
}
