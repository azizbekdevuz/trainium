import { useState, useTransition } from 'react';
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
      <button className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50" onClick={() => setOpen(true)}>
        {t('reviews.reply', 'Reply')}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border p-4">
            <h4 className="font-medium mb-2">{t('reviews.reply', 'Reply')}</h4>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-28 w-full rounded-xl border p-3"
              placeholder={t('reviews.bodyPh', 'Share details about your experience...')}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg border px-3 h-9 hover:bg-gray-50" onClick={() => setOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="rounded-lg bg-cyan-600 text-white px-4 h-9 hover:bg-cyan-700 disabled:opacity-50"
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
        </div>
      )}
    </>
  );
}

