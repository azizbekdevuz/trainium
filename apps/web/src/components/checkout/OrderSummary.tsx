import { useMemo } from 'react';
import { formatCurrency } from '../../lib/format';
import { useI18n } from '../providers/I18nProvider';
import type { CartDTO } from './types';

interface OrderSummaryProps {
  cart: CartDTO;
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  const { t } = useI18n();
  const totalCents = useMemo(
    () => cart.items.reduce((s, it) => s + it.priceCents * it.qty, 0),
    [cart.items]
  );
  const currency = cart.items[0]?.currency ?? "KRW";

  return (
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
  );
}

