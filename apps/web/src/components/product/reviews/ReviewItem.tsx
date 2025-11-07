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

  if (review.deletedLocal) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{t('reviews.deleted', 'Review deleted. Undo available for 10 minutes.')}</div>
        {pendingUndoId === review.id && (
          <UndoButton reviewId={review.id} productId={productId} onUndo={onUndo} />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">{review.user?.name ?? t('reviews.anonymous', 'Anonymous')}</span>
        {review.user?.email && (
          <span className="text-gray-500">
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
          <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {t('common.edited', 'Edited')} {new Date(review.editedAt).toLocaleDateString()}
          </span>
        ) : null}
        <span className="ml-auto" />
        <ReviewLikeButtonInline reviewId={review.id} />
      </div>
      {review.title && <div className="mt-1 font-medium">{review.title}</div>}
      <p className="mt-1 text-gray-700 text-sm">{review.body}</p>
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
              className="text-xs rounded-lg border px-2 h-7 hover:bg-red-50 text-red-700"
              onClick={() => onDelete(review)}
            >
              {t('common.delete', 'Delete')}
            </button>
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

