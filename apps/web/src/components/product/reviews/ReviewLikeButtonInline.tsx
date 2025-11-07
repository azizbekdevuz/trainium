import { useState, useTransition } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { showToast } from '../../../lib/toast';

interface ReviewLikeButtonInlineProps {
  reviewId: string;
  initialCount?: number; // Not used currently, but kept for future use
  initialLiked?: boolean;
}

export function ReviewLikeButtonInline({ reviewId, initialLiked = false }: ReviewLikeButtonInlineProps) {
  const { t } = useI18n();
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={`inline-flex items-center gap-1 text-xs rounded-full border px-2 h-7 transition-colors ${
        liked
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            setLiked(Boolean(data.liked));
          } else if (res.status === 401) {
            showToast(t('auth.form.signinRequired', 'Please sign in to continue'));
          }
        });
      }}
      title={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
      aria-label={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
    >
      <span>👍</span>
    </button>
  );
}

