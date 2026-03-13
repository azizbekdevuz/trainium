import { describe, it, expect } from 'vitest';
import { buildDedupKey, deduplicateNotifications } from './deduplicate';

describe('buildDedupKey', () => {
  it('keys ORDER_UPDATE by orderId, status, tracking', () => {
    const n = {
      id: '1',
      type: 'ORDER_UPDATE',
      title: 'Shipped',
      message: 'x',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
      data: { orderId: 'ord-123', orderStatus: 'SHIPPED', trackingNumber: 'TRK1' },
    };
    expect(buildDedupKey(n)).toBe('ORDER_UPDATE-ORD-123-SHIPPED-TRK1');
  });

  it('keys PRODUCT_ALERT by productId when present', () => {
    const n = {
      id: '1',
      type: 'PRODUCT_ALERT',
      title: 'Low Stock',
      message: 'x',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
      data: { productId: 'prod-abc' },
    };
    expect(buildDedupKey(n)).toBe('PRODUCT_ALERT-prod-abc');
  });

  it('keys PRODUCT_ALERT by productSlug when productId absent', () => {
    const n = {
      id: '1',
      type: 'PRODUCT_ALERT',
      title: 'Low Stock',
      message: 'x',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
      data: { productSlug: 'my-product' },
    };
    expect(buildDedupKey(n)).toBe('PRODUCT_ALERT-my-product');
  });

  it('falls back to type-title-time for PRODUCT_ALERT without productId/productSlug', () => {
    const n = {
      id: '1',
      type: 'PRODUCT_ALERT',
      title: 'New Product',
      message: 'x',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
    };
    const key = buildDedupKey(n);
    expect(key).toMatch(/^PRODUCT_ALERT-New Product-\d+$/);
  });
});

describe('deduplicateNotifications', () => {
  it('merges socket + db with same key, treats as read only when all read', () => {
    const socket = [
      { id: 's1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: false, timestamp: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const db = [
      { id: 'd1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: false, createdAt: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const result = deduplicateNotifications(socket, db);
    expect(result).toHaveLength(1);
    expect(result[0].read).toBe(false);
  });

  it('treats as unread when old read + new unread merge (same product)', () => {
    const socket = [
      { id: 's1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: false, timestamp: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const db = [
      { id: 'd1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: true, createdAt: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const result = deduplicateNotifications(socket, db);
    expect(result).toHaveLength(1);
    expect(result[0].read).toBe(false);
  });

  it('treats as read when all sources read', () => {
    const socket = [
      { id: 's1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: true, timestamp: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const db = [
      { id: 'd1', type: 'PRODUCT_ALERT', title: 'x', message: 'm', read: true, createdAt: '2024-01-01T00:00:00Z', data: { productId: 'p1' } },
    ];
    const result = deduplicateNotifications(socket, db);
    expect(result).toHaveLength(1);
    expect(result[0].read).toBe(true);
  });
});
