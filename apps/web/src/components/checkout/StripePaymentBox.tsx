'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useI18n } from '../providers/I18nProvider';
import { useTheme } from '../providers/ThemeProvider';
import { StripeTestCards } from './StripeTestCards';
import { StripeUzbekHelper } from './StripeUzbekHelper';
import type { Address } from './types';

interface StripePaymentBoxProps {
  cartId: string;
  address: Address;
  clientSecret: string;
  canPay: boolean;
  publishableKey?: string | null;
}

export function StripePaymentBox({
  cartId,
  address,
  clientSecret,
  canPay,
  publishableKey,
}: StripePaymentBoxProps) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showTestCards, setShowTestCards] = useState(false);
  
  // Check if we're in test mode (Stripe test keys start with pk_test_)
  const isTestMode = publishableKey?.startsWith('pk_test_') ?? 
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_'));

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
    <div className={`rounded-2xl border p-5 space-y-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
      {/* Test Mode Banner */}
      {isTestMode && (
        <StripeTestCards 
          showTestCards={showTestCards} 
          onToggle={() => setShowTestCards(!showTestCards)} 
        />
      )}
      
      {/* Uzbek Language Helper */}
      <StripeUzbekHelper />
      
      {/* Stripe Payment Element */}
      <div className="min-h-[220px]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      
      {/* Error Message */}
      {message && (
        <div className={`text-sm p-3 rounded-lg ${
          theme === 'dark' 
            ? 'bg-red-900/20 border border-red-700/50 text-red-300' 
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}
      
      {/* Pay Button */}
      <button 
        onClick={onPay} 
        disabled={!stripe || submitting || !canPay} 
        className={`w-full rounded-2xl px-5 py-3 font-medium transition ${
          theme === 'dark'
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            : 'bg-black hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {submitting ? t('checkout.processing', 'Processing...') : t('checkout.payNow', 'Pay now')}
      </button>
    </div>
  );
}

