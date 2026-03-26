'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Toast = { id: number; message: string };

let toastId = 1;

export function showToast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('toast:show', { detail: { message, id: toastId++ } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onShow = (e: Event) => {
      const { message, id } = (e as CustomEvent).detail || {};
      if (!message) return;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
    window.addEventListener('toast:show', onShow);
    return () => window.removeEventListener('toast:show', onShow);
  }, []);

  const node = (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[2147483647] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-elevated inline-block rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-semibold tracking-wide text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}


