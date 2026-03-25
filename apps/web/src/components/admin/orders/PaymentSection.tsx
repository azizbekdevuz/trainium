import { formatCurrency } from '../../../lib/utils/format';
import { LocalTime } from '@/components/ui/LocalTime';
import type { OrderData } from './types';
import type { Dictionary } from '../../../lib/i18n/i18n';

interface PaymentSectionProps {
  payments: OrderData['payments'];
  dict: Dictionary;
}

export function PaymentSection({ payments, dict }: PaymentSectionProps) {
  return (
    <section className="glass-surface rounded-2xl border border-[var(--border-default)] p-6">
      <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.paymentHeader ?? 'Payment Information'}</h2>
      {payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">{payment.provider}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                  payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-ui-inset text-ui-secondary'
                }`}>
                  {payment.status}
                </span>
              </div>
              <div className="text-sm text-ui-muted">
                {(dict.admin?.orders?.detail?.amount ?? 'Amount')}: {formatCurrency(payment.amountCents, payment.currency)}
              </div>
              {payment.providerRef && (
                <div className="text-xs text-ui-faint font-mono">
                  {(dict.admin?.orders?.detail?.ref ?? 'Ref')}: {payment.providerRef}
                </div>
              )}
              <div className="text-xs text-ui-faint">
                <LocalTime date={payment.createdAt} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-ui-faint">{dict.admin?.orders?.detail?.noPayment ?? 'No payment information available'}</div>
      )}
    </section>
  );
}

