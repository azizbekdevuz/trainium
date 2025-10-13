import Link from 'next/link';
import CartClearOnSuccess from '../../../components/cart/CartClearOnSuccess';
import { getDictionary, negotiateLocale } from '../../../lib/i18n';
import { CelebrationIcon } from '../../../components/ui/Icon';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string; method?: string; paymentMethod?: string }>;
}) {
  const params = await searchParams;
  const isTestMode = params.test === 'true';
  const paymentMethod = params.method;
  const specificPaymentMethod = params.paymentMethod;
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      {/* Clear mini-cart badge on success */}
      <CartClearOnSuccess />
      <div className="mb-6 flex justify-center">
        <CelebrationIcon className="w-16 h-16 text-cyan-600" />
      </div>
      <h1 className="font-display text-3xl mb-4">{dict.checkout_success?.thankYou ?? 'Thank you!'}</h1>
      
      {isTestMode && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>{dict.checkout_success?.testMode ?? 'Test Mode'}:</strong> {dict.checkout_success?.testNote ?? 'This was a test payment. No real money was charged.'}
          </p>
        </div>
      )}
      
      <p className="text-gray-600 dark:text-slate-400 mb-2">{dict.checkout_success?.success ?? 'Your payment was successful.'}</p>
      
      {paymentMethod && (
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          {dict.checkout_success?.paymentMethod ?? 'Payment method'}: {
            paymentMethod === 'toss' 
              ? `${dict.checkout?.toss ?? 'Toss Payments'}${specificPaymentMethod ? ` (${specificPaymentMethod})` : ''}`
              : (dict.checkout?.stripe ?? 'Stripe')
          }
        </p>
      )}
      
      <div className="space-y-3">
        <a 
          href={`/${lang}/account`} 
          className="inline-block rounded-2xl px-6 py-3 bg-cyan-600 text-white hover:bg-cyan-700 transition"
        >
          {dict.checkout_success?.viewOrders ?? 'View your orders'}
        </a>
        <br />
        <Link 
          href={`/${lang}/products?q=&category=&inStock=1&min=0&max=50000000&sort=new`} 
          className="inline-block rounded-2xl px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          {dict.checkout_success?.continue ?? 'Continue shopping'}
        </Link>
      </div>
    </div>
  );
}  