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
        transports: ['websocket', 'polling'],
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
      this.socket.on('authenticated', (data) => {
        console.log('Socket.IO authenticated:', data);
        this.emit('auth:authenticated', data);
      });

      this.socket.on('auth_error', (error) => {
        console.error('Socket.IO authentication error:', error);
        this.emit('auth:error', error);
      });

      // Notification handlers
      this.socket.on('notification', (notification: SocketNotification) => {
        console.log('Received notification:', notification);
        this.emit('notification:received', notification);
      });

      this.socket.on('system_notification', (notification: SocketNotification) => {
        console.log('Received system notification:', notification);
        this.emit('notification:system', notification);
      });

      this.socket.on('order_update', (update) => {
        console.log('Received order update:', update);
        this.emit('order:update', update);
      });

      this.socket.on('product_alert', (alert) => {
        console.log('Received product alert:', alert);
        this.emit('product:alert', alert);
      });

      this.socket.on('admin_notification', (notification: SocketNotification) => {
        console.log('Received admin notification:', notification);
        this.emit('notification:admin', notification);
      });

      // Ping/pong for connection health
      this.socket.on('pong', (data) => {
        this.emit('connection:pong', data);
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
