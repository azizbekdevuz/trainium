import Link from 'next/link';
import { Package, ExternalLink, ShoppingCart } from 'lucide-react';
import type { Notification } from './types';
import type { Dictionary } from '../../../lib/i18n';

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'ORDER_UPDATE':
      return '📦';
    case 'PRODUCT_ALERT':
      return '🔔';
    case 'SYSTEM_ALERT':
      return '⚠️';
    default:
      return '📢';
  }
}

export function getNotificationColor(type: string): string {
  switch (type) {
    case 'ORDER_UPDATE':
      return 'bg-blue-50 border-blue-200';
    case 'PRODUCT_ALERT':
      return 'bg-green-50 border-green-200';
    case 'SYSTEM_ALERT':
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

export function getNotificationActions(
  notification: Notification,
  lang: string,
  dict: Dictionary,
  userEmail?: string | null
): React.ReactNode[] {
  const actions: React.ReactNode[] = [];
  const data = notification.data;

  switch (notification.type) {
    case 'ORDER_UPDATE':
      actions.push(
        <Link
          key="view-orders"
          href={`/${lang}/account/orders`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Package className="h-3 w-3" />
          {dict.notifications?.actions?.orders ?? 'View Orders'}
        </Link>
      );
      
      if (data?.orderId) {
        actions[0] = (
          <Link
            key="view-order"
            href={`/${lang}/account/orders/${data.orderId}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="h-3 w-3" />
            {dict.notifications?.actions?.viewOrder ?? 'View Order'}
          </Link>
        );
        
        if (data?.orderStatus === 'SHIPPED' && data?.trackingNumber) {
          const email = userEmail || data.userEmail;
          const trackUrl = email 
            ? `/${lang}/track/${data.trackingNumber}?email=${email}`
            : `/${lang}/track/`;
          
          actions.push(
            <Link
              key="track-order"
              href={trackUrl}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {dict.notifications?.actions?.track ?? 'Track Package'}
            </Link>
          );
        }
        
        if (data?.orderStatus === 'DELIVERED' && data?.firstProductSlug) {
          actions.push(
            <Link
              key="reorder"
              href={`/${lang}/products/${data.firstProductSlug}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              {dict.notifications?.actions?.reorder ?? 'Reorder'}
            </Link>
          );
        }
      }
      break;

    case 'PRODUCT_ALERT':
      actions.push(
        <Link
          key="view-products"
          href={`/${lang}/products`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {dict.notifications?.actions?.products ?? 'Products'}
        </Link>
      );
      
      if (data?.productSlug) {
        actions[0] = (
          <Link
            key="view-product"
            href={`/${lang}/products/${data.productSlug}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.view ?? 'View'}
          </Link>
        );
        
        if (data?.productName && notification.title.includes('Low Stock')) {
          actions.push(
            <Link
              key="add-to-cart"
              href={`/${lang}/products/${data.productSlug}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              {dict.notifications?.actions?.addToCart ?? 'Add to Cart'}
            </Link>
          );
        }
      }
      break;

    case 'SYSTEM_ALERT':
      actions.push(
        <Link
          key="learn-more"
          href={`/${lang}/about`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {dict.notifications?.actions?.view ?? 'View'}
        </Link>
      );
      break;
      
    default:
      actions.push(
        <Link
          key="view-account"
          href={`/${lang}/account`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {dict.notifications?.actions?.account ?? 'Account'}
        </Link>
      );
      break;
  }

  return actions;
}

export function translateNotification(raw: string, dict: Dictionary): string {
  if (!raw || typeof raw !== 'string') return raw as any;
  if (!raw.startsWith('i18n.')) return raw;
  const [keyPath, ...params] = raw.split('|');
  const path = keyPath.replace(/^i18n\./, '');
  const getByPath = (obj: any, p: string): unknown => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), obj);
  const tpl = getByPath(dict, path);
  if (typeof tpl !== 'string') return raw;
  let templateStr: string = tpl;
  templateStr = templateStr.replace(/\{\{(\d+),\s*optional(?:,\s*prefix=\s*([^}|]+))?(?:\s*,\s*suffix=\s*([^}]+))?\s*\}\}/g, (_m: string, idxStr: string, pre?: string, suf?: string) => {
    const idx: number = Number(idxStr);
    const val = params[idx] ?? '';
    if (!val) return '';
    return `${pre ?? ''}${val}${suf ?? ''}`;
  });
  templateStr = templateStr.replace(/\{\{(\d+)\}\}/g, (_m: string, idxStr: string) => {
    const idx: number = Number(idxStr);
    return params[idx] ?? '';
  });
  return templateStr;
}

