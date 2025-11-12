'use client';

import SmartImage from "../../components/ui/media/SmartImage";
import Link from "next/link";
import { useMemo, useState, Fragment } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { Dialog, Transition } from "@headlessui/react";
import { createPortal } from "react-dom";
import { formatCurrency } from "../../lib/utils/format";
import { getStatusConfig } from "../../lib/order/order-status";
import { useI18n } from "../../components/providers/I18nProvider";
import { formatDateTime } from "../../lib/utils/date-utils";
import { Icon } from "../../components/ui/media/Icon";

type OrderItemDTO = { id: string; name: string; sku: string | null; qty: number; priceCents: number; };
type ShippingDTO = { fullName: string; phone: string; address1: string; address2: string | null; city: string; state: string | null; postalCode: string; country: string; status: string | null; carrier: string | null; trackingNo: string | null; };
type OrderDTO = { id: string; status: string; createdAt: string; totalCents: number; currency: string; items: OrderItemDTO[]; shipping: ShippingDTO | null; };
type CartItemDTO = { id: string; qty: number; priceCents: number; product: { id: string; name: string }; variant: { id: string | null; name: string } | null; };
type CartDTO = { id: string; items: CartItemDTO[] };

// ✅ allow nullable email/image
type DataProps = {
  sessionUser: { name: string | null; email: string | null; image: string | null };
  orders: OrderDTO[];
  activeCart: CartDTO | null;
};

const toHttps = (url?: string | null) =>
  url?.startsWith("http://") ? url.replace(/^http:\/\//, "https://") : url ?? null;

export default function AccountClient({ data }: { data: DataProps }) {
  const { sessionUser, orders, activeCart } = data;
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string | null; image: string | null }>({ name: sessionUser.name, image: sessionUser.image });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const AccountProfileEditor = useMemo(() => dynamic(() => import('../../components/account/AccountProfileEditor'), { ssr: false }), []);

  const activeCartTotal = useMemo(() => {
    if (!activeCart) return 0;
    return activeCart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
  }, [activeCart]);

  // Check if there are any orders that need tracking
  const hasTrackableOrders = useMemo(() => {
    if (!orders.length) return false;
    
    const trackableStatuses = ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'];
    return orders.some(order => trackableStatuses.includes(order.status));
  }, [orders]);

  const avatar = toHttps(localUser.image ?? sessionUser.image) || "/images/default-avatar.png";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade">
      {/* header */}
      <div className="flex flex-col gap-4 sm:gap-6 animate-fade-up">
        <div className="flex items-center gap-3 sm:gap-4">
          <SmartImage
            src={avatar} // ✅ always https or local fallback
            alt={sessionUser.name || t('account.userAvatar', 'User Avatar')}
            width={60}
            height={60}
            className="rounded-full w-12 h-12 sm:w-15 sm:h-15"
          />
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold">
              {t('account.greeting', 'Hi, ')}{localUser.name || t('account.user', 'User')} <Icon name="smile" className="w-5 h-5 sm:w-6 sm:h-6 inline ml-1" />
            </h1>
            {/* ✅ tolerate missing email */}
            <p className="text-gray-600 text-sm sm:text-base">{sessionUser.email ?? "—"}</p>
          </div>
        </div>
        
        {/* Action buttons - mobile optimized */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setEditorOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Icon name="user" className="w-4 h-4" /> {t('account.profile.edit', 'Edit profile')}
          </button>
          
          {/* Track Your Order CTA - Only show if there are trackable orders */}
          {hasTrackableOrders && (
            <Link
              href={`/${lang}/track`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Icon name="package" className="w-4 h-4 animate-pulse" />
              <span className="text-sm animate-pulse">{t('account.trackCta', 'Track Your Order')}</span>
            </Link>
          )}
          
          {/* Notifications Link */}
          <Link
            href={`/${lang}/account/notifications`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Icon name="bell" className="w-4 h-4" /> {t('account.notifications', 'Notifications')}
          </Link>
          
          {/* Favourites Link */}
          <Link
            href={`/${lang}/favourites`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl text-sm font-medium hover:bg-pink-100 transition dark:bg-pink-900/20 dark:text-pink-300 dark:hover:bg-pink-900/30"
          >
            <Icon name="star" className="w-4 h-4" /> {t('favorites.title', 'Favorites')}
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* orders */}
        <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('account.orderHistory', 'Order History')}</h2>
          {orders.length ? (
            <ul className="divide-y">
              {orders.map((o, i) => {
                return (
                  <li
                    key={o.id}
                    className="py-3 px-2 rounded-lg hover:bg-gray-50 transition animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }} // subtle stagger
                  >
                    <Link href={`/${lang}/account/orders/${o.id}`} className="flex w-full items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base text-gray-500 truncate">
                          {(() => {
                            const short = o.id.includes('_') ? o.id.slice(-6) : o.id.slice(0, 8);
                            return `${t('account.order', 'Order')} ${short.toUpperCase()}`;
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">{formatDateTime(o.createdAt)}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm sm:text-base font-semibold">
                          {formatCurrency(o.totalCents, o.currency)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusConfig(o.status as any).color} dark:border dark:border-slate-700`}>
                          {(() => {
                            const key = o.status.toLowerCase();
                            const ordersDict: unknown = t('admin.orders') as any;
                            return ordersDict?.[key] ?? getStatusConfig(o.status as any).label;
                          })()}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm sm:text-base text-gray-500">{t('account.noOrders', 'No orders yet.')}</p>
          )}
        </section>

        {/* active cart */}
        <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('account.activeCart', 'Active Cart')}</h2>
          {activeCart ? (
            <>
              <ul className="space-y-2 text-sm sm:text-base">
                {activeCart.items.map((it, i) => (
                  <li
                    key={it.id}
                    className="flex justify-between items-start animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="text-gray-800 flex-1 min-w-0 pr-2">
                      {it.product.name}{it.variant ? ` (${it.variant.name})` : ""}
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base flex-shrink-0">x{it.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 sm:mt-4 text-right text-sm sm:text-base">
                <span className="text-gray-500">{t('account.total', 'Total')}: </span>
                <span className="font-semibold">
                  {formatCurrency(activeCartTotal)}
                </span>
              </div>
              <Link
                href={`/${lang}/cart`}
                className="mt-4 inline-block w-full sm:w-auto text-center px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-700 transition"
              >
                {t('account.goToCart', 'Go to cart')}
              </Link>
            </>
          ) : (
            <p className="text-sm sm:text-base text-gray-500">{t('account.emptyCart', 'Your cart is empty.')}</p>
          )}
        </section>
      </div>

      {/* modal with Headless UI transitions */}
      {selectedOrder && createPortal(
        <Transition show={!!selectedOrder} as={Fragment}>
          <Dialog onClose={() => setSelectedOrder(null)} className="fixed inset-0 z-[80]">
            {/* backdrop */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" />
            </Transition.Child>

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                    {t('account.order', 'Order')} {selectedOrder.id.slice(0, 8).toUpperCase()}
                  </Dialog.Title>

                  {/* Order Items */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">{t('account.modal.items', 'Items')}</h3>
                    <div className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      {selectedOrder.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-start">
                          <span className="flex-1 min-w-0 pr-2">
                            {it.name} {it.sku ? `(${it.sku})` : ""} × {it.qty}
                          </span>
                          <span className="flex-shrink-0">{formatCurrency(it.priceCents)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Details */}
                  {selectedOrder.shipping && (
                    <div className="mb-4 sm:mb-6 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <h3 className="font-medium mb-2 text-sm sm:text-base">{t('account.modal.shippingDetails', 'Shipping Details')}</h3>
                      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <div><span className="font-medium">{t('account.modal.name', 'Name')}:</span> {selectedOrder.shipping.fullName}</div>
                        <div><span className="font-medium">{t('account.modal.phone', 'Phone')}:</span> {selectedOrder.shipping.phone}</div>
                        <div><span className="font-medium">{t('account.modal.address', 'Address')}:</span> {selectedOrder.shipping.address1}</div>
                        {selectedOrder.shipping.address2 && (
                          <div className="ml-2 sm:ml-4">{selectedOrder.shipping.address2}</div>
                        )}
                        <div className="ml-2 sm:ml-4">{selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.postalCode}</div>
                        <div className="ml-2 sm:ml-4">{selectedOrder.shipping.country}</div>
                        {selectedOrder.shipping.status && (
                          <div className="mt-2"><span className="font-medium">{t('account.modal.status', 'Status')}:</span>
                            <span className="ml-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                              {selectedOrder.shipping.status}
                            </span>
                          </div>
                        )}
                        {selectedOrder.shipping.trackingNo && (
                          <div><span className="font-medium">{t('account.modal.tracking', 'Tracking')}:</span>
                            <span className="ml-1 font-mono text-xs break-all">{selectedOrder.shipping.trackingNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full rounded-xl bg-cyan-600 text-white py-2 sm:py-3 text-sm sm:text-base hover:bg-cyan-700 transition"
                  >
                    {t('account.modal.close', 'Close')}
                  </button>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>,
        document.body
      )}

      {editorOpen && (
        <AccountProfileEditor
          initialName={localUser.name}
          initialImage={localUser.image}
          initialEmail={(data as any)?.sessionUser?.email ?? null}
          onUpdated={(u) => setLocalUser(u)}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {deleteOpen && createPortal(
        <Transition show={deleteOpen} as={Fragment}>
          <Dialog onClose={() => !deleting && setDeleteOpen(false)} className="fixed inset-0 z-[80]">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/50" />
            </Transition.Child>
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
                  <Dialog.Title className="text-lg sm:text-xl font-semibold mb-2">{t('account.profile.deleteTitle', 'Delete account?')}</Dialog.Title>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300">{t('account.profile.deleteBody', 'This will permanently remove your profile data. Orders and legal records remain for compliance. This action cannot be undone.')}</p>
                  {deleteError && <div className="mt-3 text-sm text-red-600">{deleteError}</div>}
                  <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                    <button onClick={() => setDeleteOpen(false)} disabled={deleting} className="h-10 px-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-slate-800 text-sm sm:text-base">{t('common.cancel', 'Cancel')}</button>
                    <button onClick={async () => {
                      setDeleting(true); setDeleteError(null);
                      try {
                        const res = await fetch('/api/account/profile', { method: 'DELETE' });
                        if (!res.ok) { setDeleteError(t('account.profile.deletedFailed', 'Failed to delete account')); setDeleting(false); return; }
                        await signOut({ callbackUrl: `/${lang}` });
                      } catch {
                        setDeleteError(t('account.profile.deletedFailed', 'Failed to delete account'));
                        setDeleting(false);
                      }
                    }} className="h-10 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base">
                      {deleting ? t('checkout.processing', 'Processing...') : t('account.profile.deleteConfirm', 'Delete')}
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>,
        document.body
      )}
    </div>
  );
}