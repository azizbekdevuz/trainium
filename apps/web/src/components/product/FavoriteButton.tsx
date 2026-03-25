'use client'

import { useState, useTransition } from 'react'
import { useI18n } from '../providers/I18nProvider'

export function FavoriteButton({ productId, initiallyFavorited = false, initialCount = 0, showCount = false }: { productId: string; initiallyFavorited?: boolean; initialCount?: number; showCount?: boolean }) {
  const { t } = useI18n()
  const [favorited, setFavorited] = useState(initiallyFavorited)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/favorites/toggle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productId }) })
        const data = await res.json()
        if (res.ok) {
          setFavorited(Boolean(data.favorited))
          if (typeof data.count === 'number') setCount(data.count)
        }
      } catch { /* ignore network errors */ }
    })
  }

  return (
    <button
      type="button"
      aria-label={favorited ? t('favorites.remove', 'Remove from favorites') : t('favorites.add', 'Add to favorites')}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full ${showCount ? 'px-3 h-8' : 'h-9 w-9'} border text-sm shadow-sm backdrop-blur transition-colors ${favorited 
        ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-400 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30' 
        : 'border-ui-strong bg-ui-elevated text-ui-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-ui-inset dark:border-white/25 dark:bg-black/45 dark:text-white/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)] dark:hover:bg-black/55'}`}
      disabled={isPending}
      title={favorited ? t('favorites.added', 'Favorited') : t('favorites.add', 'Favorite')}
    >
      <span className={showCount ? 'mr-1' : ''} aria-hidden>{favorited ? '♥' : '♡'}</span>
      {showCount ? count : null}
    </button>
  )
}


