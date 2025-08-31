// Lightweight cart event bus for client-side updates without polling

export type CartChangedDetail = {
  count?: number;
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function emitCartChanged(detail: CartChangedDetail = {}): void {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent<CartChangedDetail>('cart:changed', { detail }));
}

export function emitCartCleared(): void {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('cart:cleared'));
}

export function onCartChanged(handler: (detail: CartChangedDetail) => void): () => void {
  if (!isBrowser) return () => {};
  const listener = (e: Event) => {
    const ev = e as CustomEvent<CartChangedDetail>;
    handler(ev.detail || {});
  };
  window.addEventListener('cart:changed', listener as EventListener);
  return () => window.removeEventListener('cart:changed', listener as EventListener);
}

export function onCartCleared(handler: () => void): () => void {
  if (!isBrowser) return () => {};
  const listener = () => handler();
  window.addEventListener('cart:cleared', listener);
  return () => window.removeEventListener('cart:cleared', listener);
}


