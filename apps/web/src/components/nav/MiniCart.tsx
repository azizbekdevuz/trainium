'use client';

import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import SmartImage from '../ui/media/SmartImage';
import { formatCurrency } from '../../lib/utils/format';
import CartCount from './CartCount';
import { onCartChanged, onCartCleared } from '../../lib/cart/cart-events';
import { ShoppingCart } from 'lucide-react';
import { useI18n } from '../providers/I18nProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { showToast } from '../../lib/ui/toast';

type MiniItem = {
  id: string;
  name: string;
  variantName: string | null;
  qty: number;
  priceCents: number;
  currency: string;
  image: string | null;
};

export default function MiniCart() {
  const { dict, lang } = useI18n();
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MiniItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [currency, setCurrency] = useState('KRW');
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Mobile panel is portaled to `document.body`; must be included in outside-click checks. */
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [mobilePanelStyle, setMobilePanelStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (mobilePanelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  async function openCart() {
    setOpen((v) => !v);
    if (open) return;
    setLoading(true);
    const res = await fetch('/api/cart/mini', { cache: 'no-store' });
    const j = await res.json();
    setItems(j.items || []);
    setSubtotal(j.subtotal || 0);
    setCurrency(j.currency || 'KRW');
    setLoading(false);
  }

  // Refresh mini cart when cart changes while dropdown is open
  useEffect(() => {
    const offChanged = onCartChanged(async () => {
      if (!open) return;
      try {
        setLoading(true);
        const res = await fetch('/api/cart/mini', { cache: 'no-store' });
        const j = await res.json();
        setItems(j.items || []);
        setSubtotal(j.subtotal || 0);
        setCurrency(j.currency || 'KRW');
      } finally {
        setLoading(false);
      }
    });
    const offCleared = onCartCleared(() => {
      if (!open) return;
      setItems([]);
      setSubtotal(0);
    });
    return () => {
      offChanged();
      offCleared();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !isMobile) {
      setMobilePanelStyle({});
      return undefined;
    }
    const el = triggerRef.current;
    if (!el) return undefined;
    const place = () => {
      const rect = el.getBoundingClientRect();
      const margin = 12;
      const vw = window.innerWidth;
      const maxPanel = Math.min(320, vw - margin * 2);
      const widthIfRightAligned = Math.min(maxPanel, Math.max(0, rect.right - margin));
      if (widthIfRightAligned >= 220) {
        setMobilePanelStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          right: vw - rect.right,
          width: widthIfRightAligned,
          maxHeight: 'min(70dvh, 520px)',
        });
      } else {
        setMobilePanelStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: margin,
          right: margin,
          width: 'auto',
          maxHeight: 'min(70dvh, 520px)',
        });
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, isMobile, loading, items.length]);

  const isEmpty = !loading && items.length === 0;
  const emptyClick = (e: React.MouseEvent) => {
    if (!isEmpty) return;
    e.preventDefault();
    e.stopPropagation();
    showToast(dict.cart?.minicart?.emptyAction ?? 'Please add some products to the cart, then try again.');
  };

  const panelInner = (
    <>
      <div className="p-3 sm:p-4 border-b font-medium text-sm sm:text-base">{dict.cart?.minicart?.title ?? 'Your cart'}</div>
      <div className="max-h-60 sm:max-h-80 overflow-auto">
        {loading ? (
          <div className="p-3 sm:p-4 text-sm text-ui-faint dark:text-ui-faint">{dict.cart?.minicart?.loading ?? 'Loading…'}</div>
        ) : items.length === 0 ? (
          <div className="p-3 sm:p-4 text-sm text-ui-faint dark:text-ui-faint">{dict.cart?.empty ?? 'Your cart is empty.'}</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="flex gap-2 sm:gap-3 p-2 sm:p-3 items-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-ui-inset dark:bg-ui-elevated relative overflow-hidden flex-shrink-0">
                  {it.image ? (
                    <SmartImage src={it.image} alt={it.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-ui-faint text-xs">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs sm:text-sm">{it.name}</div>
                  {it.variantName && (
                    <div className="text-xs text-ui-faint truncate">{it.variantName}</div>
                  )}
                  <div className="text-xs text-ui-muted">x{it.qty}</div>
                </div>
                <div className="text-xs sm:text-sm font-medium flex-shrink-0">
                  {formatCurrency(it.priceCents * it.qty, it.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ui-muted dark:text-ui-faint">{dict.cart?.subtotal ?? 'Subtotal'}</span>
          <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
        </div>
        {!loading && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/${lang}/cart`}
              className={`text-center rounded-xl border px-2 sm:px-3 py-2 text-xs sm:text-sm ${isEmpty ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ui-inset dark:hover:bg-ui-inset dark:text-slate-100'}`}
              onClick={emptyClick}
            >
              {dict.cart?.minicart?.viewCart ?? 'View cart'}
            </Link>
            <Link
              href={`/${lang}/checkout`}
              className={`text-center rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm ${isEmpty ? 'bg-cyan-600/50 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'} text-white`}
              onClick={emptyClick}
            >
              {dict.cart?.checkout ?? 'Checkout'}
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={openCart}
        className="relative hover:opacity-90 transition text-sm"
        aria-label={dict.cart?.button ?? 'Cart'}
        aria-expanded={open}
      >
        <ShoppingCart className="inline-block h-5 w-5" />
        <CartCount />
      </button>

      {open && !isMobile && (
        <div className="rounded-2xl frosted-panel overflow-hidden z-[90] shadow-lg absolute right-0 mt-2 w-[320px]">
          {panelInner}
        </div>
      )}
      {open && isMobile && mounted
        ? createPortal(
            <div
              ref={mobilePanelRef}
              className="rounded-2xl frosted-panel overflow-hidden shadow-lg z-[200]"
              style={mobilePanelStyle}
            >
              {panelInner}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}


