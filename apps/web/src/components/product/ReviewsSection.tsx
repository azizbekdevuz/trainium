'use client';

import { useState, useTransition } from 'react';
import { useI18n } from '../providers/I18nProvider';
import { showToast } from '../../lib/ui/toast';
import { useReviews } from './reviews/hooks/useReviews';
import { useUndo } from './reviews/hooks/useUndo';
import { ReviewItem } from './reviews/ReviewItem';
import type { ReviewItem as ReviewItemType } from './reviews/types';
export function ReviewsSection({ productId, className = 'mt-10' }: { productId: string; className?: string }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { items, setItems, cursor, setCursor, loaded, loadMore, loadReviews } = useReviews(productId);
  const { pendingUndoId, setPendingUndoId, saveUndoState, clearUndo, scheduleUndoExpiry } = useUndo(
    productId,
    items,
    setItems,
    loaded,
    t
  );

  const handleDelete = (review: ReviewItemType) => {
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${review.id}/delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      if (res.ok) {
        const index = items.findIndex((it) => it.id === review.id);
        saveUndoState(review, index < 0 ? 0 : index);
        setItems((prev) => prev.map((it) => (it.id === review.id ? { ...it, deletedLocal: true } : it)));
        setPendingUndoId(review.id);
        scheduleUndoExpiry(review.id);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created'));
        showToast(t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.'));
      } else {
        showToast(t('common.tryAgain', 'Try Again'));
      }
    });
  };

  const handleUndo = (reviewId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${reviewId}/delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'undo' }),
      });
      if (res.ok) {
        const r2 = await fetch(`/api/reviews?productId=${productId}`);
        const d2 = await r2.json();
        if (r2.ok) {
          setItems(d2.items ?? []);
          setCursor(d2.nextCursor);
        }
        clearUndo();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created'));
        showToast(t('reviews.restored', 'Review restored'));
      } else {
        showToast(t('common.tryAgain', 'Try Again'));
      }
    });
  };

  const handleUpdated = (reviewId: string, payload: Partial<ReviewItemType> & { editedAt?: string }) => {
    setItems((prev) => prev.map((it) => (it.id === reviewId ? { ...it, ...payload } as any : it)));
  };

  return (
    <section id="reviews" className={className}>
      <h3 className="font-display text-2xl mb-3">{t('reviews.title', 'Reviews')}</h3>
      {!loaded ? null : items.length === 0 ? (
        <div className="text-sm text-ui-muted">{t('reviews.beFirst', 'Be the first to tell others about this product')}</div>
        
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="glass-surface rounded-xl border border-[var(--border-default)] p-4">
              <ReviewItem
                review={r}
                productId={productId}
                pendingUndoId={pendingUndoId}
                onDelete={handleDelete}
                onUndo={handleUndo}
                onUpdated={(payload) => handleUpdated(r.id, payload)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3">
        {cursor && (
          <div className="mt-4">
            <button
              className="rounded-xl border px-4 h-10 text-sm hover:bg-ui-inset"
              onClick={loadMore}
              disabled={isPending}
            >
              {t('reviews.loadMore', 'Load more')}
            </button>
          </div>
        )}
        {items.length > 10 && (
          <button
            className="rounded-xl border px-4 h-10 text-sm hover:bg-ui-inset"
            onClick={() => {
              if (!collapsed) {
                setItems((prev) => prev.slice(0, 10));
                setCursor(undefined);
                setCollapsed(true);
              } else {
                loadReviews();
                setCollapsed(false);
              }
            }}
          >
            {collapsed ? t('common.showAll', 'Show all') : t('common.showLess', 'Show less')}
          </button>
        )}
      </div>
    </section>
  );
}
