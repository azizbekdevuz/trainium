import { auth } from '../../auth'
import { negotiateLocale, getDictionary } from '../../lib/i18n'
import { listUserFavoriteProducts } from '../../lib/services/favorites'
import { listUserLikedProducts } from '../../lib/services/likes'
import { FavouritesClient } from '../../components/account/FavouritesClient'

export const revalidate = 0

export default async function FavouritesPage() {
  const session = await auth()
  const lang = await negotiateLocale()
  const dict = await getDictionary(lang)
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl">{dict?.favorites?.title ?? 'Favorites'}</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">{dict?.favorites?.signin ?? 'Please sign in to view your favorites.'}</p>
      </div>
    )
  }

  const [{ items: favItems }, { items: likeItems }] = await Promise.all([
    listUserFavoriteProducts(session.user.id, 24),
    listUserLikedProducts(session.user.id, 24),
  ])

  const favProducts = favItems.map((f) => ({
    id: f.product.id,
    slug: f.product.slug,
    name: f.product.name,
    priceCents: f.product.variants[0]?.priceCents ?? f.product.priceCents,
    currency: f.product.currency,
    imageSrc: (Array.isArray(f.product.images) && (f.product.images as { src: string }[])[0]?.src) || undefined,
    inStock: f.product.inventory?.inStock ?? undefined,
    lowStockAt: f.product.inventory?.lowStockAt ?? undefined,
    initialFavCount: 0,
    initialLikeCount: 0,
    initiallyFavorited: true,
    initialLiked: false,
  }))
  const likedProducts = likeItems.map((l) => ({
    id: l.product.id,
    slug: l.product.slug,
    name: l.product.name,
    priceCents: l.product.variants[0]?.priceCents ?? l.product.priceCents,
    currency: l.product.currency,
    imageSrc: (Array.isArray(l.product.images) && (l.product.images as { src: string }[])[0]?.src) || undefined,
    inStock: l.product.inventory?.inStock ?? undefined,
    lowStockAt: l.product.inventory?.lowStockAt ?? undefined,
    initialFavCount: 0,
    initialLikeCount: 0,
    initiallyFavorited: false,
    initialLiked: true,
  }))

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-3xl">{dict?.favorites?.title ?? 'Favorites'}</h1>
      <div className="mt-4">
        <FavouritesClient favProducts={favProducts as any} likedProducts={likedProducts as any} />
      </div>
    </div>
  )
}


