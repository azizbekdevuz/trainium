'use client';

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementLocale, type Appearance } from "@stripe/stripe-js";
import { formatCurrency } from "../../lib/format";
import { z } from "zod";
import { useI18n } from "../../components/providers/I18nProvider";
import { Icon } from "../../components/ui/Icon";
import { useTheme } from "../../components/providers/ThemeProvider";

// Extend window object for Toss Payments
declare global {
  interface Window {
    TossPayments: {
      loadTossPayments: (clientKey: string) => Promise<unknown>;
    };
  }
}

type CartDTO = {
  id: string;
  items: { id: string; name: string; qty: number; priceCents: number; currency: string }[];
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Map our app locales to Stripe supported locales
function getStripeLocale(appLang: string): StripeElementLocale {
  const supported: StripeElementLocale[] = [
    'auto','bg','cs','da','de','el','en','en-GB','es','es-419','et','fi','fil','fr','fr-CA','hr','hu','id','it','ja','ko','lt','lv','ms','mt','nb','nl','pl','pt','pt-BR','ro','ru','sk','sl','sv','th','tr','vi','zh','zh-HK','zh-TW'
  ];
  const asExact = supported.find(l => l === (appLang as StripeElementLocale));
  if (asExact) return asExact;
  if (appLang === 'uz') return 'en';
  if (appLang.startsWith('pt')) return 'pt-BR';
  if (appLang.startsWith('zh')) return 'zh';
  return 'en';
}

type PaymentMethod = 'stripe' | 'toss';

export default function CheckoutClient({ cart }: { cart: CartDTO }) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [tossPaymentData, setTossPaymentData] = useState<{
    tossConfig?: { clientKey: string };
    amount?: number;
    orderId?: string;
    orderName?: string;
    customerName?: string;
    customerEmail?: string;
  } | null>(null);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "KR",
  });
  const AddressSchema = useMemo(() => z.object({
    fullName: z.string().min(2, t('checkout.fullNameReq', 'Full name is required')),
    phone: z.string().min(6, t('checkout.phoneReq', 'Phone is required')),
    address1: z.string().min(3, t('checkout.address1Req', 'Address is required')),
    address2: z.string().optional(),
    city: z.string().min(2, t('checkout.cityReq', 'City is required')),
    state: z.string().optional(),
    postalCode: z.string().min(3, t('checkout.postalReq', 'Postal code is required')),
    country: z.string().min(2, t('checkout.countryReq', 'Country is required')),
  }), [t]);
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});
  const isAddressValid = useMemo(() => {
    const parsed = AddressSchema.safeParse(address);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (v && v[0]) e[k] = v[0] as string;
      }
      setAddrErrors(e);
      return false;
    }
    setAddrErrors({});
    return true;
  }, [AddressSchema, address]);
  const totalCents = useMemo(
    () => cart.items.reduce((s, it) => s + it.priceCents * it.qty, 0),
    [cart.items]
  );
  const currency = cart.items[0]?.currency ?? "KRW";

  // Build Stripe appearance, hide internal labels for unsupported locales (uz)
  const stripeAppearance = useMemo<Appearance>(() => {
    const isDark = theme === 'dark';
    const base: Appearance = {
      theme: isDark ? 'night' : 'stripe',
      variables: isDark
        ? {
            colorPrimary: '#06b6d4',        // cyan-500
            colorText: '#e2e8f0',           // slate-200
            colorTextSecondary: '#94a3b8',  // slate-400
            colorBackground: '#0f172a',     // slate-900
            colorIcon: '#94a3b8',
            colorDanger: '#ef4444',         // red-500
            borderRadius: '12px',
          }
        : {
            colorPrimary: '#0891b2',        // cyan-600
            colorText: '#0b1220',
            colorBackground: '#ffffff',
            borderRadius: '12px',
          },
      rules: isDark
        ? {
            '.Label': { color: '#cbd5e1' },                // slate-300
            '.Input': { backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' },
            '.Block': { backgroundColor: '#0f172a', borderColor: '#334155' },
            '.Tab': { backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' },
            '.Tab:hover': { color: '#f1f5f9' },
            '.Tab--selected': { color: '#f1f5f9', borderColor: '#06b6d4' },
            '.Link': { color: '#22d3ee' },                  // cyan-400
          }
        : {},
    };
    if (lang === 'uz') {
      base.rules = {
        ...(base.rules || {}),
        '.Label': { display: 'none' as const },
        '.TabLabel': { display: 'none' as const },
        '.Link': { display: 'none' as const },
      } as any;
    }
    return base;
  }, [lang, theme]);

  // Create payment intent when component mounts or payment method changes
  useEffect(() => {
    (async () => {
      const endpoint = paymentMethod === 'stripe' 
        ? "/api/checkout/create-intent"
        : "/api/checkout/toss/create-intent";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, address, paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to start checkout");
        return;
      }
      
      if (paymentMethod === 'stripe') {
        setClientSecret(json.clientSecret);
        setPublishableKey(json.publishableKey);
        setTossPaymentData(null);
      } else {
        // For Toss Payments, store the entire response
        setTossPaymentData(json);
        setClientSecret('toss'); // Set a placeholder to indicate ready
        setPublishableKey('toss');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.id, paymentMethod]);

  // For Stripe, we need both clientSecret and publishableKey
  // For Toss, we just need tossPaymentData with valid structure
  const isReady = paymentMethod === 'stripe' 
    ? (clientSecret && publishableKey && clientSecret !== 'toss') 
    : (tossPaymentData && tossPaymentData.tossConfig && tossPaymentData.amount && tossPaymentData.orderId);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl">{t('checkout.title', 'Checkout')}</h1>
        <p className="mt-3 text-gray-600">{t('checkout.preparing', 'Preparing secure payment…')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <h1 className="font-display text-2xl sm:text-3xl">{t('checkout.title', 'Checkout')}</h1>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5">
        <h2 className="font-semibold mb-3 text-sm sm:text-base">{t('checkout.shipping', 'Shipping details')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.fullName ? 'border-red-400' : ''}`} placeholder={t('checkout.fullName', 'Full name')}
              value={address.fullName} onChange={e => setAddress(a => ({...a, fullName: e.target.value}))} />
            {addrErrors.fullName && <p className="mt-1 text-xs text-red-600">{addrErrors.fullName}</p>}
          </div>
          <div>
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.phone ? 'border-red-400' : ''}`} placeholder={t('checkout.phone', 'Phone')}
              value={address.phone} onChange={e => setAddress(a => ({...a, phone: e.target.value}))} />
            {addrErrors.phone && <p className="mt-1 text-xs text-red-600">{addrErrors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.address1 ? 'border-red-400' : ''}`} placeholder={t('checkout.address1', 'Address line 1')}
              value={address.address1} onChange={e => setAddress(a => ({...a, address1: e.target.value}))} />
            {addrErrors.address1 && <p className="mt-1 text-xs text-red-600">{addrErrors.address1}</p>}
          </div>
          <div className="sm:col-span-2">
            <input className="border rounded-xl px-3 h-10 w-full" placeholder={t('checkout.address2', 'Address line 2 (optional)')}
              value={address.address2} onChange={e => setAddress(a => ({...a, address2: e.target.value}))} />
          </div>
          <div>
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.city ? 'border-red-400' : ''}`} placeholder={t('checkout.city', 'City')}
              value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))} />
            {addrErrors.city && <p className="mt-1 text-xs text-red-600">{addrErrors.city}</p>}
          </div>
          <div>
            <input className="border rounded-xl px-3 h-10 w-full" placeholder={t('checkout.state', 'State')}
              value={address.state} onChange={e => setAddress(a => ({...a, state: e.target.value}))} />
          </div>
          <div>
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.postalCode ? 'border-red-400' : ''}`} placeholder={t('checkout.postal', 'Postal code')}
              value={address.postalCode} onChange={e => setAddress(a => ({...a, postalCode: e.target.value}))} />
            {addrErrors.postalCode && <p className="mt-1 text-xs text-red-600">{addrErrors.postalCode}</p>}
          </div>
          <div>
            <input className={`border rounded-xl px-3 h-10 w-full ${addrErrors.country ? 'border-red-400' : ''}`} placeholder={t('checkout.country', 'Country (KR/US/…)')}
              value={address.country} onChange={e => setAddress(a => ({...a, country: e.target.value}))} />
            {addrErrors.country && <p className="mt-1 text-xs text-red-600">{addrErrors.country}</p>}
          </div>
        </div>
        {!isAddressValid && (
          <p className="mt-2 text-xs text-red-600">{t('checkout.completeShipping', 'Please complete required shipping fields.')}</p>
        )}
      </section>

      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5">
        <h2 className="font-semibold mb-3 text-sm sm:text-base">{t('checkout.summary', 'Order summary')}</h2>
        <ul className="text-sm space-y-2">
          {cart.items.map(it => (
            <li key={it.id} className="flex justify-between">
              <span>{it.name} × {it.qty}</span>
              <span>{formatCurrency(it.priceCents * it.qty, it.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t pt-3 flex justify-between font-semibold">
          <span>{t('checkout.total', 'Total')}</span>
          <span>{formatCurrency(totalCents, currency)}</span>
        </div>
      </section>

      {/* Payment Method Selector */}
      <section className="rounded-2xl border bg-white dark:bg-slate-900 p-5">
        <h2 className="font-semibold mb-3">{t('checkout.method', 'Payment Method')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('stripe')}
            className={`rounded-xl border-2 p-4 text-center transition ${
              paymentMethod === 'stripe'
                ? 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:bg-slate-900 dark:text-slate-100'
                : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-300'
            }`}
          >
            <div className="font-medium">{t('checkout.intlPay', 'International Payment')}</div>
            <div className="text-sm text-gray-500 dark:text-slate-300 mt-1">{t('checkout.stripe', 'Stripe (Cards & Global)')}</div>
          </button>
          <button
            onClick={() => setPaymentMethod('toss')}
            className={`rounded-xl border-2 p-4 text-center transition ${
              paymentMethod === 'toss'
                ? 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:bg-slate-900 dark:text-slate-100'
                : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-300'
            }`}
          >
            <div className="font-medium">{t('checkout.krPay', 'Korean Local Payment')}</div>
            <div className="text-sm text-gray-500 dark:text-slate-300 mt-1">{t('checkout.toss', 'Toss Payments (KRW)')}</div>
          </button>
        </div>
      </section>

      {/* Payment Component */}
      {paymentMethod === 'stripe' ? (
        <Elements
          key={`stripe-${theme}`}
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret!,
            locale: getStripeLocale(lang),
            appearance: stripeAppearance,
          }}
        >
          <StripePaymentBox cartId={cart.id} address={address} clientSecret={clientSecret!} canPay={isAddressValid} />
        </Elements>
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-slate-800 text-yellow-800 dark:text-yellow-300 px-4 py-3 text-sm">
            {t('checkout.testMode', 'TEST MODE: Payments are simulated for Toss. No real charges.')}
          </div>
          <TossPaymentWidget cartId={cart.id} address={address} paymentData={tossPaymentData!} canPay={isAddressValid} />
        </>
      )}
    </div>
  );
}

function StripePaymentBox({
  cartId,
  address,
  clientSecret,
  canPay,
}: {
  cartId: string;
  address: {
    fullName: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  clientSecret: string;
  canPay: boolean;
}) {
  const { t, lang } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onPay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);

    const requiredFields: (keyof typeof address)[] = ['fullName', 'phone', 'address1', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !address[field]?.trim());

    if (missingFields.length > 0) {
      setMessage(t('checkout.completeShipping', 'Please complete required shipping fields.'));
      setSubmitting(false);
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message || t('checkout.formFailed', 'Form validation failed'));
      setSubmitting(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || t('checkout.failed', 'Payment failed'));
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, paymentIntentId: paymentIntent.id, address }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage(j.error || t('checkout.serverFinalizeFailed', 'Server failed to finalize order'));
        setSubmitting(false);
        return;
      }
      window.location.href = "/checkout/success?method=stripe";
    } else {
      setMessage(t('checkout.notCompleted', 'Payment not completed yet. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      {lang === 'uz' && (
        <div className="text-sm text-gray-700 space-y-1" id="stripe-uz-labels">
          <div className="font-medium">{t('checkout.cardHelpTitle', "Kartangiz ma'lumotlarini kiriting")}</div>
          <div>• {t('checkout.cardHelpCardNumber', "Karta raqami")}</div>
          <div>• {t('checkout.cardHelpExpiry', "Amal qilish muddati")}</div>
          <div>• {t('checkout.cardHelpCvc', "CVC (xavfsizlik kodi)")}</div>
          <div>• {t('checkout.cardHelpCountry', "Mamlakat")}</div>
        </div>
      )}
      <PaymentElement />
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button onClick={onPay} disabled={!stripe || submitting || !canPay} className="w-full rounded-2xl px-5 py-3 bg-black text-white hover:opacity-90 transition">
        {submitting ? t('checkout.processing', 'Processing...') : t('checkout.payNow', 'Pay now')}
      </button>
    </div>
  );
}

function TossPaymentWidget({
  cartId,
  address,
  paymentData,
  canPay,
}: {
  cartId: string;
  address: {
    fullName: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentData: {
    tossConfig?: { clientKey: string };
    amount?: number;
    orderId?: string;
    orderName?: string;
    customerName?: string;
    customerEmail?: string;
  };
  canPay: boolean;
}) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);


  if (!paymentData || !paymentData.tossConfig || !paymentData.amount || !paymentData.orderId) {
    console.error('TossPaymentWidget: Invalid paymentData:', paymentData);
    return (
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="text-center py-8">
          <div className="mb-4 flex justify-center">
            <Icon name="error" className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{t('checkout.invalidData', 'Invalid payment data')}</h3>
          <p className="text-gray-600 text-sm">{t('checkout.refresh', "Unable to retrieve payment information. Please refresh the page.")}</p>
        </div>
      </div>
    );
  }

  const handleDirectPayment = async (method: string) => {
    setSubmitting(true);
    setMessage(null);

    const requiredFields: (keyof typeof address)[] = ['fullName', 'phone', 'address1', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !address[field]?.trim());
    if (missingFields.length > 0) {
      setMessage(t('checkout.completeShipping', 'Please complete required shipping fields.'));
      setSubmitting(false);
      return;
    }

    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/checkout/toss/redirect';
      const fields = { cartId, address: JSON.stringify(address), method, orderId: paymentData.orderId, amount: paymentData.amount, orderName: paymentData.orderName, customerName: paymentData.customerName, customerEmail: paymentData.customerEmail } as Record<string, string | number | undefined>;
      Object.entries(fields).forEach(([key, value]) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = String(value ?? ''); form.appendChild(input); });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Payment request failed:', error);
      setMessage(t('checkout.requestError', 'An error occurred while requesting payment: ') + (error instanceof Error ? error.message : 'Unknown error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      <div className="text-center py-4">
        <h3 className="font-semibold text-lg mb-2">🇰🇷 TossPayments</h3>
        <p className="text-gray-600 text-sm mb-4">{t('checkout.tossDesc', 'Secure and convenient Korean local payment service')}</p>
        {paymentData && (
          <div className="text-sm text-gray-600">
            {t('checkout.amount', 'Payment amount')}: <span className="font-semibold">₩{paymentData.amount?.toLocaleString('en-US')}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">{t('checkout.selectMethod', 'Select a payment method')}</h4>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleDirectPayment('카드')} disabled={submitting || !canPay} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition text-center disabled:opacity-50">
            <div className="mb-2 flex justify-center">
              <Icon name="payment" className="w-8 h-8" />
            </div>
            <div className="font-medium text-sm">{t('checkout.card', 'Credit/Debit Card')}</div>
          </button>
          <button onClick={() => handleDirectPayment('계좌이체')} disabled={submitting || !canPay} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition text-center disabled:opacity-50">
            <div className="mb-2 flex justify-center">
              <Icon name="home" className="w-8 h-8" />
            </div>
            <div className="font-medium text-sm">{t('checkout.bank', 'Real-time bank transfer')}</div>
          </button>
          <button onClick={() => handleDirectPayment('가상계좌')} disabled={submitting || !canPay} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition text-center disabled:opacity-50">
            <div className="mb-2 flex justify-center">
              <Icon name="home" className="w-8 h-8" />
            </div>
            <div className="font-medium text-sm">{t('checkout.vbank', 'Virtual bank account')}</div>
          </button>
          <button onClick={() => handleDirectPayment('휴대폰')} disabled={submitting || !canPay} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition text-center disabled:opacity-50">
            <div className="mb-2 flex justify-center">
              <Icon name="phone" className="w-8 h-8" />
            </div>
            <div className="font-medium text-sm">{t('checkout.mobile', 'Mobile payment')}</div>
          </button>
        </div>
        <div className="border-t pt-4">
          <h5 className="font-medium text-gray-900 mb-3">{t('checkout.wallets', 'Popular E-Wallets')}</h5>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDirectPayment('카카오페이')} disabled={submitting || !canPay} className="p-3 border-2 border-gray-200 rounded-xl hover:border-yellow-500 transition text-center disabled:opacity-50">
              <div className="mb-1 flex justify-center">
                <Icon name="star" className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="font-medium text-sm">{t('checkout.kakao', 'KakaoPay')}</div>
            </button>
            <button onClick={() => handleDirectPayment('네이버페이')} disabled={submitting || !canPay} className="p-3 border-2 border-gray-200 rounded-xl hover:border-green-500 transition text-center disabled:opacity-50">
              <div className="mb-1 flex justify-center">
                <Icon name="star" className="w-6 h-6 text-green-500" />
              </div>
              <div className="font-medium text-sm">{t('checkout.naver', 'NaverPay')}</div>
            </button>
            <button onClick={() => handleDirectPayment('페이코')} disabled={submitting || !canPay} className="p-3 border-2 border-gray-200 rounded-xl hover:border-red-500 transition text-center disabled:opacity-50">
              <div className="mb-1 flex justify-center">
                <Icon name="parking" className="w-6 h-6" />
              </div>
              <div className="font-medium text-sm">{t('checkout.payco', 'Payco')}</div>
            </button>
            <button onClick={() => handleDirectPayment('삼성페이')} disabled={submitting || !canPay} className="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition text-center disabled:opacity-50">
              <div className="mb-1 flex justify-center">
                <Icon name="phone" className="w-6 h-6" />
              </div>
              <div className="font-medium text-sm">{t('checkout.samsung', 'SamsungPay')}</div>
            </button>
          </div>
        </div>
      </div>

      {message && <p className="text-sm text-red-600 text-center">{message}</p>}
      {submitting && (
        <div className="text-center py-2">
          <div className="text-blue-600 text-sm">{t('checkout.redirecting', 'Redirecting to payment window...')}</div>
        </div>
      )}
      <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <Icon name="lock" className="w-3 h-3" /> {t('checkout.tossSecure', 'TossPayments secure payment system')}
      </div>
    </div>
  );
}