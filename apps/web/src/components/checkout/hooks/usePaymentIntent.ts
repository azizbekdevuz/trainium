import { useEffect, useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { PaymentMethod, Address, TossPaymentData } from '../types';

export function usePaymentIntent(
  cartId: string,
  paymentMethod: PaymentMethod,
  address: Address
) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [tossPaymentData, setTossPaymentData] = useState<TossPaymentData | null>(null);
  
  const stripePromise = useMemo(() => {
    return publishableKey ? loadStripe(publishableKey) : null;
  }, [publishableKey]);

  useEffect(() => {
    (async () => {
      const endpoint = paymentMethod === 'stripe' 
        ? "/api/checkout/stripe"
        : "/api/checkout/toss/create-intent";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, address, paymentMethod }),
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
  }, [cartId, paymentMethod]);

  // For Stripe, we need both clientSecret and publishableKey
  // For Toss, we just need tossPaymentData with valid structure
  const isReady = paymentMethod === 'stripe' 
    ? (clientSecret && publishableKey && stripePromise && clientSecret !== 'toss') 
    : (tossPaymentData && tossPaymentData.tossConfig && tossPaymentData.amount && tossPaymentData.orderId);

  return {
    clientSecret,
    publishableKey,
    tossPaymentData,
    stripePromise,
    isReady,
  };
}

