'use client';

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { useI18n } from "../../components/providers/I18nProvider";
import { useTheme } from "../../components/providers/ThemeProvider";
import { getStripeLocale } from "../../lib/checkout/checkout-utils";
import { useStripeAppearance } from "../../components/checkout/hooks/useStripeAppearance";
import { useAddressValidation } from "../../components/checkout/hooks/useAddressValidation";
import { usePaymentIntent } from "../../components/checkout/hooks/usePaymentIntent";
import { ShippingAddressForm } from "../../components/checkout/ShippingAddressForm";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { PaymentMethodSelector } from "../../components/checkout/PaymentMethodSelector";
import { StripePaymentBox } from "../../components/checkout/StripePaymentBox";
import { TossPaymentWidget } from "../../components/checkout/TossPaymentWidget";
import type { CartDTO, PaymentMethod, Address } from "../../components/checkout/types";

// Extend window object for Toss Payments
declare global {
  interface Window {
    TossPayments: {
      loadTossPayments: (clientKey: string) => Promise<unknown>;
    };
  }
}

export default function CheckoutClient({ cart }: { cart: CartDTO }) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  
  const initialAddress: Address = {
    fullName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "KR",
  };
  
  const { address, setAddress, addrErrors, isAddressValid } = useAddressValidation(initialAddress);
  
  const { clientSecret, publishableKey, tossPaymentData, stripePromise, isReady } = usePaymentIntent(
    cart.id,
    paymentMethod,
    address
  );
  
  const stripeAppearance = useStripeAppearance(theme, lang);

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

      <ShippingAddressForm 
        address={address}
        setAddress={setAddress}
        addrErrors={addrErrors}
        isAddressValid={isAddressValid}
      />

      <OrderSummary cart={cart} />

      <PaymentMethodSelector 
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
      />

      {/* Payment Component */}
      {paymentMethod === 'stripe' ? (
        <Elements
          key={`stripe-${theme}-${publishableKey}`}
          stripe={stripePromise as unknown as Stripe}
          options={{
            clientSecret: clientSecret!,
            locale: getStripeLocale(lang),
            appearance: stripeAppearance,
          }}
        >
          <StripePaymentBox 
            cartId={cart.id} 
            address={address} 
            clientSecret={clientSecret!} 
            canPay={isAddressValid} 
            publishableKey={publishableKey} 
          />
        </Elements>
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-slate-800 text-yellow-800 dark:text-yellow-300 px-4 py-3 text-sm">
            {t('checkout.testMode', 'TEST MODE: Payments are simulated for Toss. No real charges.')}
          </div>
          <TossPaymentWidget 
            cartId={cart.id} 
            address={address} 
            paymentData={tossPaymentData!} 
            canPay={isAddressValid} 
          />
        </>
      )}
    </div>
  );
}
