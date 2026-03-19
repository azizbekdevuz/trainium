import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import { showToast } from '../../../lib/ui/toast';

interface ReplyButtonInlineProps {
  parentId: string;
  onPosted: () => void;
}

export function ReplyButtonInline({ parentId, onPosted }: ReplyButtonInlineProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-ui-inset" onClick={() => setOpen(true)}>
        {t('reviews.reply', 'Reply')}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="modal-backdrop absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            className="modal-surface relative z-[1] w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-medium mb-2 text-ui-primary">{t('reviews.reply', 'Reply')}</h4>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field mt-1 min-h-28 w-full rounded-xl border p-3"
              placeholder={t('reviews.bodyPh', 'Share details about your experience...')}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-ui-inset" onClick={() => setOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="btn-primary rounded-lg px-4 h-9 disabled:opacity-50"
                disabled={isPending || !content.trim()}
                onClick={() => {
                  startTransition(async () => {
                    const res = await fetch(`/api/reviews/${parentId}/reply`, {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ content }),
                    });
                    if (res.ok) {
                      showToast(t('reviews.updatePosted', 'Update posted'));
                      setOpen(false);
                      setContent('');
                      onPosted();
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
        </div>,
        document.body
      )}
    </>
  );
}

