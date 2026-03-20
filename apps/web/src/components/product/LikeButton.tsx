'use client'

import { useState, useTransition } from 'react'
import { useI18n } from '../providers/I18nProvider'

export function ProductLikeButton({ productId, initialLiked = false, initialCount = 0, compact = false, showCount = true }: { productId: string; initialLiked?: boolean; initialCount?: number; compact?: boolean; showCount?: boolean }) {
  const { t } = useI18n()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/${productId}/like`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          setLiked(Boolean(data.liked))
          setCount(Number(data.count) || 0)
        }
      } catch { /* ignore network errors */ }
    })
  }

  return (
    <button
      type="button"
      aria-label={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
      onClick={onClick}
      className={compact
        ? `inline-flex items-center justify-center rounded-full h-9 w-9 border text-sm shadow-sm backdrop-blur transition-colors ${liked 
          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30' 
          : 'border-ui-strong bg-ui-elevated text-ui-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-ui-inset dark:border-white/25 dark:bg-black/45 dark:text-white/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)] dark:hover:bg-black/55'}`
        : `inline-flex items-center rounded-full border px-3 h-8 text-sm transition-colors ${liked 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/30' 
          : 'border-ui-default bg-ui-elevated text-ui-secondary hover:bg-ui-inset dark:border-ui-subtle dark:bg-ui-inset dark:text-ui-muted dark:hover:bg-ui-elevated'}`}
      disabled={isPending}
      title={liked ? t('likes.unlike', 'Unlike') : t('likes.like', 'Like')}
    >
      <span className={compact || !showCount ? '' : 'mr-1'}>👍</span>
      {showCount ? count : null}
    </button>
  )
}


