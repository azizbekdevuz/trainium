'use client';

import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useI18n } from '../providers/I18nProvider';
import type { Address, TossPaymentData } from './types';

interface TossPaymentWidgetProps {
  cartId: string;
  address: Address;
  paymentData: TossPaymentData;
  canPay: boolean;
}

export function TossPaymentWidget({ cartId, address, paymentData, canPay }: TossPaymentWidgetProps) {
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

