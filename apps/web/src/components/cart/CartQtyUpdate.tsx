'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateQtyAction } from '../../app/actions/cart';
import { emitCartChanged } from '../../lib/cart-events';
import { showToast } from '../../lib/toast';
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

    // If quantity is 0 or less, remove the item
    if (qty <= 0) {
      const formData = new FormData();
      formData.set('itemId', itemId);
      await updateQtyAction(formData);
      return;
    }

    // Update the quantity
    const formData = new FormData();
    formData.set('itemId', itemId);
    formData.set('qty', qty.toString());
    await updateQtyAction(formData);
    // After server mutation completes, refresh mini-cart/count on the client
    try {
      const res = await fetch('/api/cart/mini', { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        emitCartChanged({ count: j.count });
      } else {
        emitCartChanged({});
      }
    } catch {
      emitCartChanged({});
    }
    showToast(t('cart.updated', 'Cart updated'));
  };

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const toastNode = toast ? (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2147483647] pointer-events-none" role="status" aria-live="polite">
      <div className="inline-block rounded-xl bg-white text-black shadow-2xl px-4 py-2 text-sm font-semibold tracking-wide border border-black/10">
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
