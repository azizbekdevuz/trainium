import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';

interface UndoButtonProps {
  reviewId: string;
  productId: string;
  onUndo: (reviewId: string) => void;
}

export function UndoButton({ reviewId, onUndo }: UndoButtonProps) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={() => {
        setPending(true);
        onUndo(reviewId);
      }}
      disabled={pending}
      className="btn-primary rounded-xl px-4 h-9 text-sm font-medium shadow-lg disabled:opacity-50"
    >
      {pending ? t('checkout.processing', 'Processing...') : t('common.undo', 'Undo')}
    </button>
  );
}
