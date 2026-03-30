"use client";

import Link from "next/link";
import SmartImage from "../ui/media/SmartImage";
import { formatCurrency } from "../../lib/utils/format";
import { useI18n } from "../providers/I18nProvider";
import { useResponsive } from "../../hooks/useResponsive";
import { Icon } from "../ui/media/Icon";
import { FavoriteButton } from "./FavoriteButton";
import { ProductLikeButton } from "./LikeButton";
import { cn } from "@/lib/utils/format";

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
  /** Tighter layout for bento / dense grids */
  compact?: boolean;
  /** Primary category line (small caps), e.g. from listing grid */
  categoryLabel?: string;
};

export function ProductCard({
  slug,
  name,
  priceCents,
  currency,
  imageSrc,
  inStock,
  lowStockAt,
  productId,
  initiallyFavorited,
  initialFavCount,
  initialLiked,
  initialLikeCount,
  showSocialCounts = true,
  actions,
  compact = false,
  categoryLabel,
}: ProductCardProps) {
  const { t } = useI18n();
  const { isMobile } = useResponsive();

  const isOutOfStock = inStock !== undefined && inStock === 0;
  const isLowStock =
    !isOutOfStock &&
    inStock !== undefined &&
    lowStockAt != null &&
    inStock <= lowStockAt;

  const accentBar = <div className="product-card-accent-line" />;

  const well = (
    <div
      className={cn(
        'product-well w-full',
        compact
          ? isMobile
            ? 'h-[112px]'
            : 'h-[132px]'
          : 'aspect-[5/6] min-h-[152px] sm:min-h-[158px] lg:aspect-[4/5] lg:min-h-[188px]',
      )}
    >
      <div className="product-image-overlay" aria-hidden />

      <div className="atm-orb product-card-orb-fill h-[58%] w-[58%]" aria-hidden />

      {imageSrc ? (
        <SmartImage
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="relative z-[1] object-cover"
          priority={false}
        />
      ) : (
        <span className="product-card-placeholder-emoji" aria-hidden>
          🏋️
        </span>
      )}

      {productId && !actions ? (
        isMobile ? (
          <div className="absolute bottom-2 left-2 right-2 z-[4] flex justify-between">
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <FavoriteButton
                productId={productId}
                initiallyFavorited={!!initiallyFavorited}
                initialCount={initialFavCount ?? 0}
                showCount={false}
              />
            </div>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ProductLikeButton
                productId={productId}
                initialLiked={!!initialLiked}
                initialCount={initialLikeCount ?? 0}
                compact={true}
                showCount={false}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              className="absolute bottom-3 left-3 z-[4]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <FavoriteButton
                productId={productId}
                initiallyFavorited={!!initiallyFavorited}
                initialCount={initialFavCount ?? 0}
                showCount={!!showSocialCounts}
              />
            </div>
            <div
              className="absolute bottom-3 right-3 z-[4]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ProductLikeButton
                productId={productId}
                initialLiked={!!initialLiked}
                initialCount={initialLikeCount ?? 0}
                compact={true}
                showCount={!!showSocialCounts}
              />
            </div>
          </>
        )
      ) : null}

      {(isOutOfStock || isLowStock) && (
        <div className="absolute right-2 top-2 z-[4] sm:right-3 sm:top-3">
          {isOutOfStock ? (
            <span className="badge-red">{t("product.badges.outOfStock", "Out of Stock")}</span>
          ) : (
            <span className="badge-amber">
              {t("product.badges.lowStock", "Low Stock (Only {{0}} left!)").replace("{{0}}", String(inStock))}
            </span>
          )}
        </div>
      )}

      <div className="product-card-price-chip">
        <div className="product-card-price-text">{formatCurrency(priceCents, currency)}</div>
      </div>
    </div>
  );

  const titleBlock = (
    <>
      {categoryLabel ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-600/90 dark:text-cyan-400/90">
          {categoryLabel}
        </p>
      ) : null}
      <h3
        className="font-display mb-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ui-primary sm:text-[13.5px]"
        title={name}
      >
        {name}
      </h3>

      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            "min-w-0 text-[10.5px] font-semibold sm:text-[11px]",
            isOutOfStock ? "text-stock-out" : "text-ui-muted",
          )}
        >
          {isOutOfStock
            ? t("product.badges.outOfStock", "Out of Stock")
            : isLowStock
              ? t("product.badges.lowStock", "Low Stock (Only {{0}} left!)").replace("{{0}}", String(inStock))
              : inStock !== undefined
                ? `✓ ${t("product.stock.inStock", "{{0}} in stock").replace("{{0}}", String(inStock))}`
                : ""}
        </div>
        {!isMobile ? (
          <span className="hidden shrink-0 text-xs text-ui-faint opacity-0 transition group-hover:opacity-100 sm:inline">
            {t("common.view", "View")} <Icon name="arrowRight" className="ml-1 inline w-3 h-3" />
          </span>
        ) : null}
      </div>
    </>
  );

  if (actions) {
    return (
      <div className="product-card group block h-full">
        <Link
          href={`/products/${slug}`}
          className="block rounded-t-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
        >
          {accentBar}
          {well}
          <div className="relative z-[1] px-3 pt-2.5 sm:px-4 sm:pt-3">{titleBlock}</div>
        </Link>
        <div className="relative z-[1] px-3 pb-2.5 sm:px-4 sm:pb-3">
          <div className="mt-3 border-t border-ui-subtle pt-2.5">
            {actions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/products/${slug}`} className="product-card group block h-full">
      {accentBar}
      {well}
      <div className="relative z-[1] px-3 py-2.5 sm:px-4 sm:py-3">{titleBlock}</div>
    </Link>
  );
}
