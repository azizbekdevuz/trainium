"use client";

import { useEffect, useRef, useState } from 'react';
import { onCartChanged, onCartCleared } from '../../lib/cart-events';
import { usePathname } from 'next/navigation';

export default function CartCount() {
  const [count, setCount] = useState<number>(0);
  const pathname = usePathname();
  const fetching = useRef(false);

  const fetchCount = async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const res = await fetch('/api/cart/mini', { cache: 'no-store' });
      if (!res.ok) return;
      const j = await res.json();
      setCount(j.count ?? 0);
    } finally {
      fetching.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchCount();
     
  }, []);

  // Refetch on route change
  useEffect(() => {
    fetchCount();
     
  }, [pathname]);

  // Refetch on focus/visibility
  useEffect(() => {
    const onFocus = () => fetchCount();
    const onVis = () => { if (document.visibilityState === 'visible') fetchCount(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // React to explicit cart events to avoid polling
  useEffect(() => {
    const offChanged = onCartChanged(({ count: maybeCount }) => {
      if (typeof maybeCount === 'number') {
        setCount(maybeCount);
      } else {
        fetchCount();
      }
    });
    const offCleared = onCartCleared(() => setCount(0));
    return () => {
      offChanged();
      offCleared();
    };
  }, []);

  if (!count) return null;
  return (
    <span
      key={String(count)}
      className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1 text-xs text-white animate-bounce-soft">
      {count}
    </span>
  );
}