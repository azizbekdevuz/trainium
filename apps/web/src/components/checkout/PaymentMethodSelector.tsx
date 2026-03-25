import { useI18n } from '../providers/I18nProvider';
import type { PaymentMethod } from './types';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ paymentMethod, onMethodChange }: PaymentMethodSelectorProps) {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border glass-surface p-5">
      <h2 className="font-semibold mb-3">{t('checkout.method', 'Payment Method')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onMethodChange('stripe')}
          className={`rounded-xl border-2 p-4 text-center transition ${
            paymentMethod === 'stripe'
              ? 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:bg-ui-surface dark:text-slate-100'
              : 'border-ui-default hover:border-ui-default dark:border-ui-subtle dark:hover:border-ui-subtle dark:text-ui-faint'
          }`}
        >
          <div className="font-medium">{t('checkout.intlPay', 'International Payment')}</div>
          <div className="text-sm text-ui-faint dark:text-ui-faint mt-1">{t('checkout.stripe', 'Stripe (Cards & Global)')}</div>
        </button>
        <button
          onClick={() => onMethodChange('toss')}
          className={`rounded-xl border-2 p-4 text-center transition ${
            paymentMethod === 'toss'
              ? 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:bg-ui-surface dark:text-slate-100'
              : 'border-ui-default hover:border-ui-default dark:border-ui-subtle dark:hover:border-ui-subtle dark:text-ui-faint'
          }`}
        >
          <div className="font-medium">{t('checkout.krPay', 'Korean Local Payment')}</div>
          <div className="text-sm text-ui-faint dark:text-ui-faint mt-1">{t('checkout.toss', 'Toss Payments (KRW)')}</div>
        </button>
      </div>
    </section>
  );
}

