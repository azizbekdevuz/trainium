/**
 * Shared deduplication logic for bell and notifications page.
 *
 * Keying strategy:
 * - ORDER_UPDATE: orderId + status + tracking (not title; DB and socket use different titles)
 * - PRODUCT_ALERT: productId or productSlug when present; else type+title+time-bucket
 * - Merge rule: treat as read only when ALL sources are read (avoids old-read + new-unread)
 */
export interface NotificationForDedup {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    productId?: string;
    orderStatus?: string;
    status?: string;
    trackingNumber?: string;
    [key: string]: unknown;
  };
}

/** Raw shape from socket (notification:received, notification:system, product:alert, etc.) */
interface SocketNotificationShape {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  timestamp?: string;
  data?: Record<string, unknown>;
}

function normalizeOrderStatus(notif: NotificationForDedup): string {
  const status = notif.data?.orderStatus ?? notif.data?.status ?? '';
  return String(status).toUpperCase();
}

function getOrderId(notif: NotificationForDedup): string {
  const d = notif.data as Record<string, unknown> | undefined;
  const raw = d?.orderId ?? d?.order_id ?? '';
  return String(raw || '').toUpperCase();
}

export function buildDedupKey(notif: NotificationForDedup): string {
  const orderId = getOrderId(notif);
  if (notif.type === 'ORDER_UPDATE' && orderId) {
    const status = normalizeOrderStatus(notif);
    const d = notif.data as Record<string, unknown> | undefined;
    const tracking = String(d?.trackingNumber ?? d?.tracking_no ?? '').toUpperCase();
    return `ORDER_UPDATE-${orderId}-${status}-${tracking}`;
  }

  // PRODUCT_ALERT: key by productId or productSlug (DB may have productSlug before productId was added)
  if (notif.type === 'PRODUCT_ALERT') {
    const productId = (notif.data as Record<string, unknown>)?.productId;
    const productSlug = (notif.data as Record<string, unknown>)?.productSlug;
    const productKey = productId ?? productSlug ?? '';
    if (productKey) {
      return `PRODUCT_ALERT-${productKey}`;
    }
  }

  return `${notif.type}-${notif.title}-${Math.floor(new Date(notif.createdAt).getTime() / 5000)}`;
}

function normalizeSocketNotification(raw: SocketNotificationShape): NotificationForDedup {
  return {
    id: String(raw.id ?? ''),
    type: String(raw.type ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    read: Boolean(raw.read),
    createdAt: String(raw.timestamp ?? new Date().toISOString()),
    data: raw.data,
  };
}

export function deduplicateNotifications<T extends NotificationForDedup & { _dedupIds?: string[] }>(
  socketNotifications: unknown[],
  dbNotifications: T[]
): T[] {
  const normalized = (socketNotifications as SocketNotificationShape[]).map(normalizeSocketNotification);
  const combined: T[] = [...normalized, ...dbNotifications] as T[];

  const grouped = new Map<string, T[]>();

  combined.forEach(notif => {
    const key = buildDedupKey(notif);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(notif);
  });

  const deduplicated: T[] = [];

  grouped.forEach(group => {
    const ids = group.map(n => n.id);
    if (group.length === 1) {
      deduplicated.push({ ...group[0], _dedupIds: ids });
    } else {
      // Prefer DB-backed item for ORDER_UPDATE (has trackingNumber/orderId); else first in group
      const dbLike = group.find(n => {
        const d = n.data as Record<string, unknown> | undefined;
        return d && (d.trackingNumber ?? d.orderId);
      });
      const chosen = dbLike ?? group[0];
      // Only treat as read if ALL sources are read (avoids old read + new unread merging as read)
      const allRead = group.every(n => n.read);
      deduplicated.push({ ...chosen, read: allRead, _dedupIds: ids });
    }
  });

  return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
