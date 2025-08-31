'use client';

import Link from 'next/link';
import SmartImage from './ui/SmartImage';
import { formatCurrency } from '../lib/format';
import { useI18n } from './providers/I18nProvider';
import { useResponsive } from '../hooks/useResponsive';
import { Icon } from './ui/Icon';
import { FavoriteButton } from './product/FavoriteButton';
import { ProductLikeButton } from './product/LikeButton';

type ProductCardProps = {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageSrc?: string;
  inStock?: number;
  lowStockAt?: number | null;
  productId?: string;
  initiallyFavorited?: boolean;
  initialFavCount?: number;
  initialLiked?: boolean;
  initialLikeCount?: number;
  showSocialCounts?: boolean;
  actions?: React.ReactNode;
};

export function ProductCard({ slug, name, priceCents, currency, imageSrc, inStock, lowStockAt, productId, initiallyFavorited, initialFavCount, initialLiked, initialLikeCount, showSocialCounts = true, actions }: ProductCardProps) {
  const { t } = useI18n();
  const { isMobile } = useResponsive();
  
  return (
    <Link
      href={`/products/${slug}`}
      className="group block h-full rounded-xl sm:rounded-2xl border bg-white overflow-hidden transition hover:shadow-sm"
    >
      {/* Responsive aspect image */}
      <div className="aspect-square sm:aspect-[4/3] bg-gray-100 relative">
        {imageSrc ? (
          <SmartImage 
            src={imageSrc} 
            alt={name} 
            fill 
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" 
            className="object-cover" 
            priority={false} 
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
            Image coming soon
          </div>
        )}
        
        {/* Responsive action buttons */}
        {productId && !actions && (
          <>
            {isMobile ? (
              <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <FavoriteButton productId={productId} initiallyFavorited={!!initiallyFavorited} initialCount={initialFavCount ?? 0} showCount={false} />
                </div>
                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <ProductLikeButton productId={productId} initialLiked={!!initialLiked} initialCount={initialLikeCount ?? 0} compact={true} showCount={false} />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="absolute bottom-3 left-3"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <FavoriteButton productId={productId} initiallyFavorited={!!initiallyFavorited} initialCount={initialFavCount ?? 0} showCount={!!showSocialCounts} />
                </div>
                <div
                  className="absolute bottom-3 right-3"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <ProductLikeButton productId={productId} initialLiked={!!initialLiked} initialCount={initialLikeCount ?? 0} compact={true} showCount={!!showSocialCounts} />
                </div>
              </>
            )}
          </>
        )}
        
        {/* Stock Badges */}
        {inStock !== undefined && lowStockAt !== null && lowStockAt !== undefined && inStock <= lowStockAt && inStock > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg animate-pulse">
              {t('product.badges.lowStock', 'Low Stock (Only {{0}} left!)').replace('{{0}}', String(inStock))}
            </div>
          </div>
        )}
        
        {inStock !== undefined && inStock === 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
              {t('product.badges.outOfStock', 'Out of Stock')}
            </div>
          </div>
        )}
      </div>

      {/* Responsive content */}
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        {/* Title: responsive sizing */}
        <h3
          className="font-medium leading-snug text-sm sm:text-base line-clamp-2"
          title={name}
        >
          {name}
        </h3>

        {/* Price row */}
        <div className="mt-auto flex items-baseline justify-between">
          <span className="text-cyan-700 font-semibold text-sm sm:text-base">
            {formatCurrency(priceCents, currency)}
          </span>
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition hidden sm:inline">
            {t('common.view', 'View')} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
          </span>
        </div>
        {actions && (
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            {actions}
          </div>
        )}
      </div>
    </Link>
  );
}