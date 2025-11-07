import Link from 'next/link';
import { Package, ExternalLink, ShoppingCart } from 'lucide-react';
import type { Notification } from './types';
import type { Dictionary } from '../../../lib/i18n';

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
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          <Package className="h-3 w-3" />
          {dict.notifications?.actions?.orders ?? 'Orders'}
        </Link>
      );

      if (data?.orderId) {
        actions[0] = (
          <Link
            key="view-order"
            href={`/${lang}/account/orders/${data.orderId}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
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
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {dict.notifications?.actions?.track ?? 'Track'}
            </Link>
          );
        }

        if (data?.orderStatus === 'DELIVERED' && data?.firstProductSlug) {
          actions.push(
            <Link
              key="reorder"
              href={`/${lang}/products/${data.firstProductSlug}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
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
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
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
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {dict.notifications?.actions?.view ?? 'View'}
          </Link>
        );

        if (notification.type === 'PRODUCT_ALERT' && data?.productName) {
          actions.push(
            <Link
              key="add-to-cart"
              href={`/${lang}/products/${data.productSlug}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              {dict.notifications?.actions?.addToCart ?? 'Add to Cart'}
            </Link>
          );
        }
      }
      break;

    default:
      actions.push(
        <Link
          key="view-account"
          href={`/${lang}/account`}
          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {dict.notifications?.actions?.account ?? 'Account'}
        </Link>
      );
      break;
  }

  return actions;
}

export function deduplicateNotifications(
  socketNotifications: any[],
  dbNotifications: Notification[]
): Notification[] {
  const combined: Notification[] = [
    ...socketNotifications.map(notif => ({
      id: (notif as any).id,
      type: (notif as any).type,
      title: (notif as any).title,
      message: (notif as any).message,
      read: Boolean((notif as any).read),
      createdAt: (notif as any).timestamp || new Date().toISOString(),
      data: (notif as any).data as any,
    })) as unknown as Notification[],
    ...dbNotifications,
  ];

  const grouped = new Map<string, typeof combined>();
  
  combined.forEach(notif => {
    let key = `${notif.type}-${notif.title}-${Math.floor(new Date(notif.createdAt).getTime() / 5000)}`;
    
    if (notif.type === 'PRODUCT_ALERT' && notif.data?.productId) {
      key += `-${notif.data.productId}`;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(notif);
  });

  const deduplicated: typeof combined = [];
  
  grouped.forEach(group => {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      const dbLike = group.find(n => Boolean(n.data && (n.data as any).trackingNumber || (n.data as any).orderId));
      deduplicated.push(dbLike ?? group[0]);
    }
  });

  return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

