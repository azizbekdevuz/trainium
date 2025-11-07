import { useState, useTransition } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import type { ReviewItem } from './types';

interface RepliesThreadProps {
  parentId: string;
  initialCount: number;
}

export function RepliesThread({ parentId, initialCount }: RepliesThreadProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ReviewItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  if (!initialCount) return null;

  return (
    <div className="mt-3">
      {!open ? (
        <button
          className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50"
          onClick={() => {
            setOpen(true);
            startTransition(async () => {
              const r = await fetch(`/api/reviews/${parentId}/replies?take=5`);
              const d = await r.json();
              if (r.ok) {
                setReplies(d.items ?? []);
                setCursor(d.nextCursor);
              }
            });
          }}
        >
          {t('reviews.showReplies', 'Show replies')} ({initialCount})
        </button>
      ) : (
        <div>
          <ul className="space-y-2">
            {replies.map((rp) => (
              <li key={rp.id} className="rounded-lg border p-3 bg-gray-50 dark:bg-slate-800 text-sm">
                <div className="text-gray-600 dark:text-slate-300">
                  <span className="font-medium">{rp.user?.name ?? t('reviews.anonymous', 'Anonymous')}</span>
                </div>
                <p className="mt-1 text-gray-700 dark:text-slate-200">{rp.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            {cursor && (
              <button
                className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-100"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const r = await fetch(`/api/reviews/${parentId}/replies?take=5&cursor=${cursor}`);
                    const d = await r.json();
                    if (r.ok) {
                      setReplies((prev) => [...prev, ...(d.items ?? [])]);
                      setCursor(d.nextCursor);
                    }
                  });
                }}
              >
                {t('common.showMore', 'Show more')}
              </button>
            )}
            <button
              className="text-xs rounded-lg border px-2 h-7 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-100"
              onClick={() => {
                setOpen(false);
                setReplies([]);
                setCursor(undefined);
              }}
            >
              {t('common.showLess', 'Show less')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

