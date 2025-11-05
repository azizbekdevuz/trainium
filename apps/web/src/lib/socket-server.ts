/**
 * Server-side Socket.IO utilities for sending notifications via external socket service
 * This version calls the socket server's HTTP endpoints instead of importing in-process code.
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

function getSocketBaseUrl() {
  const serverUrl = process.env.SOCKET_SERVER_URL?.replace(/\/$/, '');
  if (serverUrl) return serverUrl;

  const publicUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '');
  if (publicUrl && process.env.NODE_ENV !== 'production') return publicUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SOCKET_SERVER_URL is required in production');
  }
  return 'http://localhost:4000';
}

async function post(path: string, body: unknown) {
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

export async function sendSocketNotificationToUser(userId: string, notification: SocketNotification) {
  try {
    await post('/admin/notify-user', { userId, notification });
  } catch (error) {
    console.error('Failed to send Socket.IO notification to user:', error);
  }
}

export async function sendSocketSystemNotification(notification: SocketNotification) {
  try {
    await post('/admin/system-notify', { notification });
  } catch (error) {
    console.error('Failed to send Socket.IO system notification:', error);
  }
}

export async function sendSocketOrderUpdate(userId: string, orderId: string, update: OrderUpdateData) {
  try {
    await post('/admin/order-update', { userId, orderId, update });
  } catch (error) {
    console.error('Failed to send Socket.IO order update:', error);
  }
}

export async function sendSocketProductAlert(userId: string, productId: string, alert: ProductAlertData) {
  try {
    await post('/admin/product-alert', { userId, productId, alert });
  } catch (error) {
    console.error('Failed to send Socket.IO product alert:', error);
  }
}

export async function sendSocketProductAlertToAll(productId: string, alert: ProductAlertData) {
  try {
    await post('/admin/product-alert-all', { productId, alert });
  } catch (error) {
    console.error('Failed to send Socket.IO product alert to all users:', error);
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
