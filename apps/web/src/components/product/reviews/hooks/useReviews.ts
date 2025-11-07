import { useState, useEffect, useTransition, useCallback } from 'react';

export function useReviews(productId: string) {
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const loadReviews = useCallback(async () => {
    const res = await fetch(`/api/reviews?productId=${productId}`);
    const data = await res.json();
    if (res.ok) {
      setItems(data.items ?? []);
      setCursor(data.nextCursor);
      setLoaded(true);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
    const handler = () => loadReviews();
    if (typeof window !== 'undefined') window.addEventListener('review:created', handler);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('review:created', handler); };
  }, [productId, loadReviews]);

  const loadMore = async () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await fetch(`/api/reviews?productId=${productId}&cursor=${cursor}`);
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
        setCursor(data.nextCursor);
      }
    });
  };

  return {
    items,
    setItems,
    cursor,
    setCursor,
    isPending,
    startTransition,
    loaded,
    loadMore,
    loadReviews,
  };
}

