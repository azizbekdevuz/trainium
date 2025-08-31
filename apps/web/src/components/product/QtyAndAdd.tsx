'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { emitCartChanged } from '../../lib/cart-events';
import { showToast } from '../../lib/toast';
import { useI18n } from '../providers/I18nProvider';

export default function QtyAndAdd({ available, formId = 'add-to-cart-form' }: { available: number; formId?: string }) {
  const { dict } = useI18n();
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<string | null>(null);

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (qty > available) {
      setToast((dict.product?.qtyExceeds ?? 'Requested quantity exceeds stock. Available: {{0}}').replace('{{0}}', String(available)));
      return;
    }
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) {
      const handle = async () => {
        setTimeout(async () => {
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
        }, 50);
      };
      form.requestSubmit();
      handle();
      showToast(dict.product?.addToCart ?? 'Add to cart');
    }
  };

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
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">
          {dict.product?.qtyLabel ?? 'Qty'}
          <input
            name="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value || '1')))}
            className="ml-2 h-10 w-20 rounded-xl border px-3"
            id="qty-input"
          />
        </label>
        <button onClick={onAdd} className="rounded-2xl px-5 py-3 bg-cyan-600 text-white">
          {dict.product?.addToCart ?? 'Add to cart'}
        </button>
      </div>
      {typeof window !== 'undefined' && typeof document !== 'undefined' && toastNode
        ? createPortal(toastNode, document.body)
        : toastNode}
    </>
  );
}


