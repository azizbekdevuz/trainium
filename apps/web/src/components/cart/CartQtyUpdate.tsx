'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateQtyAction } from '../../app/actions/cart';
import { refreshCartCountFromServer } from '../../lib/cart/cart-events';
import { showToast } from '../../lib/ui/toast';
import { useI18n } from '../providers/I18nProvider';

interface CartQtyUpdateProps {
  itemId: string;
  currentQty: number;
  available: number;
}

export default function CartQtyUpdate({ itemId, currentQty, available }: CartQtyUpdateProps) {
  const { t } = useI18n();
  const [qty, setQty] = useState<number>(currentQty);
  const [toast, setToast] = useState<string | null>(null);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (qty > available) {
      setToast(t('cart.stockExceeded', 'Requested quantity exceeds stock. Available: {{0}}').replace('{{0}}', String(available)));
      return;
    }

    // If quantity is 0 or less, server treats qty <= 0 as delete (see updateItemQty)
    if (qty <= 0) {
      const formData = new FormData();
      formData.set('itemId', itemId);
      formData.set('qty', '0');
      await updateQtyAction(formData);
      await refreshCartCountFromServer();
      showToast(t('cart.updated', 'Cart updated'));
      return;
    }

    // Update the quantity
    const formData = new FormData();
    formData.set('itemId', itemId);
    formData.set('qty', qty.toString());
    await updateQtyAction(formData);
    await refreshCartCountFromServer();
    showToast(t('cart.updated', 'Cart updated'));
  };

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast]);

  const toastNode = toast ? (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2147483647] pointer-events-none" role="status" aria-live="polite">
      <div className="glass-elevated inline-block rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-semibold tracking-wide text-[var(--text-primary)] shadow-[var(--shadow-lg)]">
        {toast}
      </div>
    </div>
  ) : null;

  return (
    <>
      <form onSubmit={onUpdate} className="mt-3 flex items-center gap-2">
        <input
          name="qty"
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(Math.max(0, Number(e.target.value || '0')))}
          className="h-9 w-20 rounded-xl border px-3"
        />
        <button type="submit" className="h-9 rounded-xl px-3 border">
          {t('cart.update', 'Update')}
        </button>
      </form>
      {typeof window !== 'undefined' && typeof document !== 'undefined' && toastNode
        ? createPortal(toastNode, document.body)
        : toastNode}
    </>
  );
}
