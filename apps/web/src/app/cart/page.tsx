import { getCart, cartTotals } from '../../lib/cart/cart';
import { formatCurrency } from '../../lib/utils/format';
import Link from 'next/link';
import CartRemoveButton from '../../components/cart/CartRemoveButton';
import Image from 'next/image';
import CartQtyUpdate from '../../components/cart/CartQtyUpdate';
import { prisma } from '../../lib/database/db';
import { getDictionary, negotiateLocale } from '../../lib/i18n/i18n';
import { RecommendedProducts } from '../../components/recommendations/RecommendedProducts';

export const dynamic = "force-dynamic";

export async function getCartData() {
  const cart = await getCart();
  if (!cart) return null;
  
  // Fetch inventory for each product to get available stock
  const itemsWithStock = await Promise.all(
    cart.items.map(async (item) => {
      const inventory = await prisma.inventory.findUnique({
        where: { productId: item.productId },
        select: { inStock: true },
      });
      return {
        ...item,
        available: inventory?.inStock ?? 0,
      };
    })
  );
  
  return {
    ...cart,
    items: itemsWithStock,
  };
};

export default async function CartPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const cart = await getCartData();
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-display text-2xl sm:text-3xl">{dict.cart?.title ?? 'Your cart'}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-2">{dict.cart?.empty ?? 'Your cart is empty.'}</p>
        <div className="mt-6">
          <Link className="rounded-2xl px-4 sm:px-5 py-3 bg-cyan-600 text-white text-sm sm:text-base" href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`}>{dict.cart?.shop ?? 'Shop products'}</Link>
        </div>
      </div>
    );
  }

  const totals = cartTotals(cart);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl">{dict.cart?.title ?? 'Your cart'}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {cart.items.map((it: NonNullable<typeof cart>['items'][0]) => (
            <div key={it.id} className="rounded-2xl border bg-white dark:bg-slate-900 p-3 sm:p-4 grid gap-3 sm:gap-4 grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr_auto] items-start">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-gray-100 overflow-hidden relative">
                {(() => {
                  const primaryImage = (Array.isArray(it.product.images) && (it.product.images as { src: string }[])[0]?.src) || '';
                  return primaryImage ? (
                    <Image src={primaryImage} alt={it.product.name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-gray-400 text-xs">{dict.cart?.noImage ?? 'No image'}</div>
                  );
                })()}
              </div>
              <div>
                <div className="font-medium">{it.product.name}</div>
                <div className="text-xs text-gray-500">{it.variant?.name}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {formatCurrency(it.priceCents, it.product.currency)} {dict.cart?.each ?? 'each'}
                </div>

                <CartQtyUpdate 
                  itemId={it.id} 
                  currentQty={it.qty} 
                  available={it.available} 
                />
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(it.priceCents * it.qty, it.product.currency)}
                </div>
                <div className="mt-2">
                  <CartRemoveButton itemId={it.id} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 h-max">
          <h2 className="font-medium text-sm sm:text-base">{dict.cart?.summary ?? 'Order summary'}</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            <Row label={dict.cart?.subtotal ?? 'Subtotal'} value={formatCurrency(totals.subtotal, cart.items[0].product.currency)} />
            <Row label={dict.cart?.shipping ?? 'Shipping'} value={dict.cart?.calcAtCheckout ?? 'Calculated at checkout'} />
            <Row label={dict.cart?.discount ?? 'Discount'} value="- ₩0" />
          </div>
          <div className="mt-4 border-t pt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-slate-400">{dict.cart?.total ?? 'Total'}</div>
            <div className="text-base sm:text-lg font-semibold">
              {formatCurrency(totals.total, cart.items[0].product.currency)}
            </div>
          </div>
          <Link href={`/${lang}/checkout`} className="mt-4 block text-center rounded-2xl px-4 sm:px-5 py-3 bg-cyan-600 text-white text-sm sm:text-base">
            {dict.cart?.checkout ?? 'Checkout'}
          </Link>
        </aside>
      </div>

      {/* Recommendations Section */}
      <RecommendedProducts
        context="cart"
        initialLimit={5}
        showTitle={true}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}