import { io, Socket } from 'socket.io-client';

/**
 * Client-side Socket.IO utilities and connection management
 */

export interface SocketNotification {
  id: string;
  type: 'ORDER_UPDATE' | 'PRODUCT_ALERT' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: unknown;
  timestamp: string;
  read: boolean;
}

export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

class SocketClient {
  private socket: Socket | null = null;
  private lastAuth: { userId?: string; userRole?: string } = {};
  private connectionState: SocketConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  };
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Initialize Socket.IO connection
   */
  connect(userId?: string, userRole?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        // Notify any new listeners about current connection immediately
        if (this.lastAuth.userId) {
          this.authenticate(this.lastAuth.userId, this.lastAuth.userRole);
        } else if (userId) {
          this.authenticate(userId, userRole);
          this.lastAuth = { userId, userRole };
        }
        this.emit('connection:connected');
        resolve();
        return;
      }

      this.connectionState.isConnecting = true;
      this.connectionState.error = null;
      this.lastAuth = { userId, userRole };

      const socketUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://72.61.149.55:4000');

      this.socket = io(socketUrl, {
        path: '/api/socketio/',
        transports: process.env.NODE_ENV === 'production' ? ['websocket'] : ['websocket', 'polling'],
        withCredentials: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket?.id);
        this.connectionState.isConnected = true;
        this.connectionState.isConnecting = false;
        this.connectionState.error = null;
        this.connectionState.reconnectAttempts = 0;

        // Authenticate if user info is provided
        if (this.lastAuth.userId) {
          this.authenticate(this.lastAuth.userId, this.lastAuth.userRole);
        }

        this.emit('connection:connected');
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.connectionState.isConnected = false;
        this.connectionState.isConnecting = false;
        this.emit('connection:disconnected', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.connectionState.isConnecting = false;
        this.connectionState.error = error.message;
        this.emit('connection:error', error);
        reject(error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
        this.connectionState.isConnected = true;
        this.connectionState.reconnectAttempts = attemptNumber;
        if (this.lastAuth.userId) {
          this.authenticate(this.lastAuth.userId, this.lastAuth.userRole);
        }
        this.emit('connection:reconnected', attemptNumber);
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket.IO reconnection attempt:', attemptNumber);
        this.connectionState.reconnectAttempts = attemptNumber;
        this.emit('connection:reconnecting', attemptNumber);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Socket.IO reconnection error:', error);
        this.connectionState.error = error.message;
        this.emit('connection:reconnect_error', error);
      });

      // Authentication handlers
      this.socket.on('authenticated', (raw: any) => {
        try {
          const data = {
            userId: raw?.userId ? String(raw.userId) : undefined,
            userRole: raw?.userRole ? String(raw.userRole) : undefined,
          };
          console.log('Socket.IO authenticated:', data);
          this.emit('auth:authenticated', data);
        } catch (e) {
          console.error('authenticated handler error:', e);
        }
      });

      this.socket.on('auth_error', (error) => {
        console.error('Socket.IO authentication error:', error);
        this.emit('auth:error', error);
      });

      // Notification handlers
      this.socket.on('notification', (raw: any) => {
        try {
          const n = {
            id: String(raw?.id ?? (globalThis.crypto?.randomUUID?.() ?? Date.now().toString())),
            type: String(raw?.type ?? 'SYSTEM_ALERT'),
            title: String(raw?.title ?? ''),
            message: String(raw?.message ?? ''),
            data: raw?.data,
            timestamp: String(raw?.timestamp ?? new Date().toISOString()),
            read: Boolean(raw?.read ?? false),
          } as SocketNotification;
          if (!n.title) {
            console.warn('Ignoring notification without title', raw);
            return;
          }
          console.log('Received notification:', n);
          this.emit('notification:received', n);
        } catch (e) {
          console.error('notification handler error:', e);
        }
      });

      this.socket.on('system_notification', (raw: any) => {
        try {
          const n = {
            id: String(raw?.id ?? (globalThis.crypto?.randomUUID?.() ?? Date.now().toString())),
            type: 'SYSTEM_ALERT' as const,
            title: String(raw?.title ?? ''),
            message: String(raw?.message ?? ''),
            data: raw?.data,
            timestamp: String(raw?.timestamp ?? new Date().toISOString()),
            read: Boolean(raw?.read ?? false),
          } as SocketNotification;
          if (!n.title) {
            console.warn('Ignoring system_notification without title', raw);
            return;
          }
          console.log('Received system notification:', n);
          this.emit('notification:system', n);
        } catch (e) {
          console.error('system_notification handler error:', e);
        }
      });

      this.socket.on('order_update', (raw: any) => {
        try {
          const normalized = {
            orderId: String(raw?.orderId ?? raw?.order_id ?? ''),
            status: raw?.status ? String(raw.status) : '',
            trackingNumber: raw?.trackingNumber ?? raw?.tracking_no ?? undefined,
            message: raw?.message ? String(raw.message) : '',
            timestamp: raw?.timestamp ?? new Date().toISOString(),
          };
          if (!normalized.orderId) {
            console.warn('Ignoring order_update without orderId', raw);
            return;
          }
          console.log('Received order update:', normalized);
          this.emit('order:update', normalized);
        } catch (e) {
          console.error('order_update handler error:', e);
        }
      });

      this.socket.on('product_alert', (raw: any) => {
        try {
          const alert = {
            productId: String(raw?.productId ?? raw?.product_id ?? ''),
            productName: raw?.productName ? String(raw.productName) : undefined,
            alertType: raw?.alertType ? String(raw.alertType) : '',
            message: String(raw?.message ?? ''),
            currentStock: typeof raw?.currentStock === 'number' ? raw.currentStock : undefined,
            lowStockAt: raw?.lowStockAt ?? null,
            newPrice: typeof raw?.newPrice === 'number' ? raw.newPrice : undefined,
            oldPrice: typeof raw?.oldPrice === 'number' ? raw.oldPrice : undefined,
            timestamp: raw?.timestamp ?? new Date().toISOString(),
          };
          if (!alert.productId || !alert.alertType) {
            console.warn('Ignoring product_alert missing productId/alertType', raw);
            return;
          }
          console.log('Received product alert:', alert);
          this.emit('product:alert', alert);
        } catch (e) {
          console.error('product_alert handler error:', e);
        }
      });

      this.socket.on('admin_notification', (raw: any) => {
        try {
          const n = {
            id: String(raw?.id ?? (globalThis.crypto?.randomUUID?.() ?? Date.now().toString())),
            type: String(raw?.type ?? 'SYSTEM_ALERT'),
            title: String(raw?.title ?? ''),
            message: String(raw?.message ?? ''),
            data: raw?.data,
            timestamp: String(raw?.timestamp ?? new Date().toISOString()),
            read: Boolean(raw?.read ?? false),
          } as SocketNotification;
          if (!n.title) {
            console.warn('Ignoring admin_notification without title', raw);
            return;
          }
          console.log('Received admin notification:', n);
          this.emit('notification:admin', n);
        } catch (e) {
          console.error('admin_notification handler error:', e);
        }
      });

      // Ping/pong for connection health
      this.socket.on('pong', (raw: any) => {
        try {
          const payload = { timestamp: String(raw?.timestamp ?? new Date().toISOString()) };
          this.emit('connection:pong', payload);
        } catch {
          this.emit('connection:pong', { timestamp: new Date().toISOString() });
        }
      });
    });
  }

  /**
   * Authenticate with the server
   */
  authenticate(userId: string, userRole?: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId, userRole });
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomType: 'order' | 'product', roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit(`join:${roomType}`, roomId);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(roomType: 'order' | 'product', roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit(`leave:${roomType}`, roomId);
    }
  }

  /**
   * Send ping to server
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): SocketConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Export types and utilities
export type { Socket };
export { SocketClient };
