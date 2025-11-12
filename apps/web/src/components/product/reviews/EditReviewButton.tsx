import { useState, useTransition } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { showToast } from '../../../lib/ui/toast';
import type { ReviewItem } from './types';

interface EditReviewButtonProps {
  review: ReviewItem;
  onUpdated: (payload: Partial<ReviewItem> & { editedAt?: string }) => void;
}

export function EditReviewButton({ review, onUpdated }: EditReviewButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(review.title ?? '');
  const [body, setBody] = useState(review.body);
  const [rating, setRating] = useState<number | undefined>(review.rating);
  const [isPending, startTransition] = useTransition();
  const canChangeRating = Date.now() - new Date(review.createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000;

  return (
    <>
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => setOpen(true)}>
        {t('common.edit', 'Edit')}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border p-4">
            <h4 className="font-medium mb-2">{t('common.edit', 'Edit')}</h4>
            <label className="block text-sm text-gray-700 mb-2">
              {t('reviews.titleLabel', 'Title (optional)')}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border px-3"
              />
            </label>
            <label className="block text-sm text-gray-700 mb-2">
              {t('reviews.bodyLabel', 'Your review')}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-xl border p-3"
              />
            </label>
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">
                {t('reviews.rating', 'Rating')} ({t('reviews.ratingChangeInfo', 'Can change after 7 days')})
              </div>
              <div className="inline-flex gap-1 opacity-100">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={!canChangeRating}
                    className={`h-8 w-8 rounded-full border ${
                      r <= (rating ?? 0) ? 'bg-yellow-100 border-yellow-300' : 'hover:bg-gray-50'
                    } ${!canChangeRating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => canChangeRating && setRating(r)}
                    aria-label={`${r}`}
                  >
                    {r <= (rating ?? 0) ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-gray-50" onClick={() => setOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="rounded-lg bg-cyan-600 text-white px-4 h-9 hover:bg-cyan-700 disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await fetch(`/api/reviews/${review.id}/edit`, {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ title, body, rating }),
                    });
                    if (res.status === 429) return showToast(t('reviews.rateLimited', 'You can edit again in 1 minute.'));
                    if (res.status === 403) return showToast(t('reviews.ratingTooSoon', 'You can change rating after 7 days.'));
                    if (res.ok) {
                      const data = await res.json();
                      onUpdated({ title, body, editedAt: data.editedAt });
                      setOpen(false);
                      showToast(t('reviews.updated', 'Review updated'));
                    } else {
                      showToast(t('common.tryAgain', 'Try Again'));
                    }
                  });
                }}
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

