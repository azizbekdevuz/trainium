'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useI18n } from '../providers/I18nProvider'
import { ProductCard } from '../product/ProductCard'

type CardItem = {
  id: string
  slug: string
  name: string
  priceCents: number
  currency: string
  imageSrc?: string
  inStock?: number
  lowStockAt?: number | null
  initialFavCount: number
  initialLikeCount: number
  initiallyFavorited: boolean
  initialLiked: boolean
}

export function FavouritesClient({ favProducts, likedProducts }: { favProducts: CardItem[]; likedProducts: CardItem[] }) {
  const { t } = useI18n()
  const [active, setActive] = useState<'fav' | 'like'>('fav')
  const [isPending, startTransition] = useTransition()
  const [favs, setFavs] = useState<CardItem[]>(favProducts)
  const [likes, setLikes] = useState<CardItem[]>(likedProducts)

  const tabs = [
    { key: 'fav', label: t('favorites.title', 'Favorites') },
    { key: 'like', label: t('likes.like', 'Likes') },
  ] as const

  const handleRemoveFav = (productId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/favorites/toggle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productId }) })
        if (res.ok) setFavs((prev) => prev.filter((p) => p.id !== productId))
      } catch { /* ignore network errors */ }
    })
  }

  const handleRemoveLike = (productId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/${productId}/like`, { method: 'POST' })
        if (res.ok) setLikes((prev) => prev.filter((p) => p.id !== productId))
      } catch { /* ignore network errors */ }
    })
  }

  const indicatorX = active === 'fav' ? 'translate-x-0' : 'translate-x-full'

  return (
    <div className="pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:pb-10">
      {/* Tabs with animated indicator */}
      <div className="relative inline-grid grid-cols-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur p-1 shadow-sm">
        <div className={`absolute inset-y-1 left-1 w-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-transform duration-300 ease-out ${indicatorX}`} />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors ${active === tab.key ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
            aria-pressed={active === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="mt-6 min-h-[120px]">
        {active === 'fav' ? (
          favs.length === 0 ? (
            <div className="text-gray-600 text-sm">{t('favorites.none', 'No favorites yet.')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch animate-[fadeIn_.35s_ease-out] mb-6 sm:mb-8">
              {favs.map((p) => (
                <div key={p.id} className="group">
                  <ProductCard
                    slug={p.slug}
                    name={p.name}
                    priceCents={p.priceCents}
                    currency={p.currency}
                    imageSrc={p.imageSrc}
                    inStock={p.inStock}
                    lowStockAt={p.lowStockAt}
                    productId={p.id}
                    initialFavCount={p.initialFavCount}
                    initialLikeCount={p.initialLikeCount}
                    initiallyFavorited={p.initiallyFavorited}
                    initialLiked={p.initialLiked}
                    showSocialCounts={false}
                    actions={(
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          onClick={(e) => { e.preventDefault(); handleRemoveFav(p.id); }}
                          disabled={isPending}
                          className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-red-50 text-red-700 border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                          aria-label={t('favorites.remove', 'Remove from favorites')}
                        >
                          {t('favorites.remove', 'Remove from favorites')}
                        </button>
                        <Link
                          href={`/products/${p.slug}`}
                          className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('nav.shop', 'Shop')}
                        </Link>
                        <Link
                          href={`/products/${p.slug}#reviews`}
                          className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('reviews.title', 'Reviews')}
                        </Link>
                      </div>
                    )}
                  />
                </div>
              ))}
            </div>
          )
        ) : likes.length === 0 ? (
          <div className="text-gray-600 text-sm">{t('likes.none', 'No likes yet.')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch animate-[fadeIn_.35s_ease-out] mb-6 sm:mb-8">
            {likes.map((p) => (
              <div key={p.id} className="group">
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  priceCents={p.priceCents}
                  currency={p.currency}
                  imageSrc={p.imageSrc}
                  inStock={p.inStock}
                  lowStockAt={p.lowStockAt}
                  productId={p.id}
                  initialFavCount={p.initialFavCount}
                  initialLikeCount={p.initialLikeCount}
                  initiallyFavorited={p.initiallyFavorited}
                  initialLiked={p.initialLiked}
                  showSocialCounts={false}
                   actions={(
                     <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                       <button
                         onClick={(e) => { e.preventDefault(); handleRemoveLike(p.id); }}
                         disabled={isPending}
                         className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
                         aria-label={t('likes.unlike', 'Unlike')}
                       >
                         {t('likes.unlike', 'Unlike')}
                       </button>
                       <Link
                         href={`/products/${p.slug}`}
                         className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                         onClick={(e) => e.stopPropagation()}
                       >
                         {t('nav.shop', 'Shop')}
                       </Link>
                       <Link
                         href={`/products/${p.slug}#reviews`}
                         className="h-11 w-full sm:w-auto px-4 rounded-lg border text-sm font-medium inline-flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                         onClick={(e) => e.stopPropagation()}
                       >
                         {t('reviews.title', 'Reviews')}
                       </Link>
                     </div>
                   )}
                 />
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}


