/**
 * Client-only cart sync bus.
 *
 * After any server mutation that changes the cart, the **calling client code** should call
 * `refreshCartCountFromServer()` (or `emitCartCleared()` / `emitCartChanged({ count: 0 })` when you know it’s empty).
 * `CartCount` and `MiniCart` subscribe here — do not add “relay” hooks that re-emit the same
 * event (that amplifies listeners and duplicates work).
 */

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

/** After a server cart mutation, call this once on the client to sync badge + open mini-cart. */
export async function refreshCartCountFromServer(): Promise<void> {
  if (!isBrowser) return;
  try {
    const res = await fetch('/api/cart/mini', { cache: 'no-store' });
    if (res.ok) {
      const j = (await res.json()) as { count?: number };
      emitCartChanged({ count: j.count });
    } else {
      emitCartChanged({});
    }
  } catch {
    emitCartChanged({});
  }
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


