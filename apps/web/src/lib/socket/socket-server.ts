/**
 * Server-side Socket.IO utilities for sending notifications via external socket service.
 *
 * Env:
 * - SOCKET_SERVER_URL: server-side HTTP calls (required in production)
 * - SOCKET_ADMIN_SECRET: X-Admin-Secret header for admin endpoints
 * - NEXT_PUBLIC_SOCKET_URL: client-side only; do not use for server calls
 */

export interface SocketNotification {
  type: 'ORDER_UPDATE' | 'PRODUCT_ALERT' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: unknown;
}

export interface OrderUpdateData {
  orderId: string;
  status: string;
  trackingNumber?: string;
  message: string;
}

export interface ProductAlertData {
  productId: string;
  productName: string;
  alertType: 'LOW_STOCK' | 'NEW_PRODUCT' | 'PRICE_CHANGE' | 'OUT_OF_STOCK';
  message: string;
  currentStock?: number;
  lowStockAt?: number | null;
  newPrice?: number;
  oldPrice?: number;
}

/** Canonical env for server-side HTTP calls to socket server. Required in production. */
const SOCKET_SERVER_URL_KEY = 'SOCKET_SERVER_URL';

function getSocketBaseUrl(): string {
  const serverUrl = process.env[SOCKET_SERVER_URL_KEY]?.replace(/\/$/, '');
  if (serverUrl) return serverUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${SOCKET_SERVER_URL_KEY} is required in production. Set it to the socket server URL (e.g. https://socket.yourdomain.com).`
    );
  }

  // Dev fallback: NEXT_PUBLIC_SOCKET_URL or localhost
  const publicUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '');
  if (publicUrl) return publicUrl;
  return 'http://localhost:4000';
}

/** Call at app startup to validate socket config. Logs warning in dev if unset. */
export function validateSocketConfig(): void {
  const url = process.env[SOCKET_SERVER_URL_KEY]?.replace(/\/$/, '');
  if (url) return;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${SOCKET_SERVER_URL_KEY} is required in production`);
  }
  console.warn(
    `[socket] ${SOCKET_SERVER_URL_KEY} not set. Using NEXT_PUBLIC_SOCKET_URL or localhost:4000 for server-side calls.`
  );
}

export type SocketSendResult = { ok: boolean; error?: string };

async function post(path: string, body: unknown): Promise<unknown> {
  const base = getSocketBaseUrl();
  if (!base) throw new Error('Socket server URL not configured');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const adminSecret = process.env.SOCKET_ADMIN_SECRET;
  if (adminSecret) {
    headers['X-Admin-Secret'] = adminSecret;
  }
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Socket server HTTP ${res.status}`);
  return res.json();
}

function toResult(error: unknown, context: string): SocketSendResult {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[socket] ${context}:`, msg);
  return { ok: false, error: msg };
}

export async function sendSocketNotificationToUser(userId: string, notification: SocketNotification): Promise<SocketSendResult> {
  try {
    await post('/admin/notify-user', { userId, notification });
    return { ok: true };
  } catch (e) {
    return toResult(e, `notify-user userId=${userId} title=${notification.title}`);
  }
}

export async function sendSocketSystemNotification(notification: SocketNotification): Promise<SocketSendResult> {
  try {
    await post('/admin/system-notify', { notification });
    return { ok: true };
  } catch (e) {
    return toResult(e, `system-notify title=${notification.title}`);
  }
}

export async function sendSocketOrderUpdate(userId: string, orderId: string, update: OrderUpdateData): Promise<SocketSendResult> {
  try {
    await post('/admin/order-update', { userId, orderId, update });
    return { ok: true };
  } catch (e) {
    return toResult(e, `order-update userId=${userId} orderId=${orderId} status=${update.status}`);
  }
}

export async function sendSocketProductAlert(userId: string, productId: string, alert: ProductAlertData): Promise<SocketSendResult> {
  try {
    await post('/admin/product-alert', { userId, productId, alert });
    return { ok: true };
  } catch (e) {
    return toResult(e, `product-alert userId=${userId} productId=${productId} type=${alert.alertType}`);
  }
}

export async function sendSocketProductAlertToAll(productId: string, alert: ProductAlertData): Promise<SocketSendResult> {
  try {
    await post('/admin/product-alert-all', { productId, alert });
    return { ok: true };
  } catch (e) {
    return toResult(e, `product-alert-all productId=${productId} type=${alert.alertType}`);
  }
}

export async function getSocketConnectionStats() {
  try {
    const base = getSocketBaseUrl();
    const res = await fetch(`${base}/admin/stats`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { ok: false, stats: { totalConnections: 0, connectedSockets: 0 } } as any;
  }
}

export async function isSocketServerAvailable(): Promise<boolean> {
  try {
    const base = getSocketBaseUrl();
    const res = await fetch(`${base}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
