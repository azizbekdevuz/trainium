import { useTransition } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { showToast } from '../../../lib/toast';

interface UndoButtonProps {
  reviewId: string;
  productId: string;
  onUndo: (reviewId: string) => void;
}

export function UndoButton({ reviewId, productId, onUndo }: UndoButtonProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  const handleUndo = () => {
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
          onUndo(reviewId);
          if (typeof window !== 'undefined') localStorage.removeItem(`review-undo-${productId}`);
          showToast(t('reviews.restored', 'Review restored'));
        }
      } else {
        showToast(t('common.tryAgain', 'Try Again'));
      }
    });
  };

  return (
    <button
      onClick={handleUndo}
      disabled={isPending}
      className="rounded-full bg-black/90 text-white text-xs px-3 h-8 shadow"
    >
      {t('common.undo', 'Undo')}
    </button>
  );
}

