import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useI18n } from '../../providers/I18nProvider';
import { EditReviewButton } from '../reviews/EditReviewButton';
import { AddUpdateButton } from './AddUpdateButton';
import { ReplyButtonInline } from '../reviews/ReplyButtonInline';
import { ReviewLikeButtonInline } from '../reviews/ReviewLikeButtonInline';
import { RepliesThread } from '../reviews/RepliesThread';
import { UndoButton } from '../reviews/UndoButton';
import type { ReviewItem as ReviewItemType } from './types';

interface ReviewItemProps {
  review: ReviewItemType;
  productId: string;
  pendingUndoId: string | null;
  onDelete: (review: ReviewItemType) => void;
  onUndo: (reviewId: string) => void;
  onUpdated: (payload: Partial<ReviewItemType> & { editedAt?: string }) => void;
}

export function ReviewItem({
  review,
  productId,
  pendingUndoId,
  onDelete,
  onUndo,
  onUpdated,
}: ReviewItemProps) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (review.deletedLocal) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-ui-muted">{t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.')}</div>
        {pendingUndoId === review.id && (
          <UndoButton reviewId={review.id} productId={productId} onUndo={onUndo} />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-ui-muted">
        <span className="font-medium">{review.user?.name ?? t('reviews.anonymous', 'Anonymous')}</span>
        {review.user?.email && (
          <span className="text-ui-faint">
            ({review.user.email.slice(0, 2)}
            {Array.from({ length: Math.max(0, review.user.email.length - 2) })
              .map(() => '*')
              .join('')})
          </span>
        )}
        <span>·</span>
        <span>
          {'★'.repeat(Math.max(0, review.rating))}
          {'☆'.repeat(Math.max(0, 5 - review.rating))}
        </span>
        {review.editedAt ? (
          <span className="ml-2 text-[10px] uppercase tracking-wide text-ui-faint bg-ui-inset px-2 py-0.5 rounded-full">
            {t('common.edited', 'Edited')} {new Date(review.editedAt).toLocaleDateString()}
          </span>
        ) : null}
        <span className="ml-auto" />
        <ReviewLikeButtonInline reviewId={review.id} />
      </div>
      {review.title && <div className="mt-1 font-medium">{review.title}</div>}
      <p className="mt-1 text-ui-secondary text-sm">{review.body}</p>
      <div className="mt-2 flex gap-2">
        {session?.user?.id === review.user?.id ? (
          <>
            <EditReviewButton review={review} onUpdated={onUpdated} />
            <AddUpdateButton
              parentId={review.id}
              onPosted={() => {
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created'));
              }}
            />
            <button
              className="text-xs rounded-lg border px-2 h-7 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              {t('common.delete', 'Delete')}
            </button>
            {confirmDelete && typeof document !== 'undefined' && createPortal(
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                onClick={() => setConfirmDelete(false)}
              >
                <div
                  className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                  style={{ zIndex: -1 }}
                  aria-hidden
                />
                <div
                  role="alertdialog"
                  aria-modal="true"
                  className="modal-surface relative w-full max-w-sm rounded-2xl p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="font-medium text-ui-primary mb-2">{t('reviews.deleteConfirmTitle', 'Delete review?')}</h4>
                  <p className="text-sm text-ui-secondary mb-4">
                    {t('reviews.deleteConfirmMessage', 'This review will be deleted. You can undo this action within 10 minutes.')}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button className="rounded-lg border px-3 h-9 hover:bg-ui-inset text-sm" onClick={() => setConfirmDelete(false)}>
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      className="rounded-lg px-4 h-9 bg-red-600 text-white text-sm hover:bg-red-700"
                      onClick={() => {
                        setConfirmDelete(false);
                        onDelete(review);
                      }}
                    >
                      {t('common.delete', 'Delete')}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </>
        ) : (
          <ReplyButtonInline
            parentId={review.id}
            onPosted={() => {
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('review:created'));
            }}
          />
        )}
      </div>
      <RepliesThread parentId={review.id} initialCount={(review as any)._count?.replies ?? (review.replies?.length ?? 0)} />
    </>
  );
}

