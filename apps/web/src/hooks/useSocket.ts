'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { socketClient, SocketConnectionState, SocketNotification } from '../lib/socket/socket-client';

export interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
  
  // Room management
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
  joinProductRoom: (productId: string) => void;
  leaveProductRoom: (productId: string) => void;
  
  // Real-time notifications
  notifications: SocketNotification[];
  unreadCount: number;
  
  // Actions
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Connection health
  ping: () => void;
  lastPong: Date | null;
}

export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const [connectionState, setConnectionState] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  });
  
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastPong, setLastPong] = useState<Date | null>(null);
  
  const isInitialized = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update connection state
  const updateConnectionState = useCallback((newState: Partial<SocketConnectionState>) => {
    setConnectionState(prev => ({ ...prev, ...newState }));
  }, []);

  // Connect to Socket.IO
  const connect = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      await socketClient.connect(session.user.id, (session.user as any).role);
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
    }
  }, [session?.user]);

  // Disconnect from Socket.IO
  const disconnect = useCallback(() => {
    // Do not forcibly disconnect on route changes; only if user signs out
    if (!session?.user?.id) {
      socketClient.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [session?.user?.id]);

  // Reconnect to Socket.IO
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Room management
  const joinOrderRoom = useCallback((orderId: string) => {
    socketClient.joinRoom('order', orderId);
  }, []);

  const leaveOrderRoom = useCallback((orderId: string) => {
    socketClient.leaveRoom('order', orderId);
  }, []);

  const joinProductRoom = useCallback((productId: string) => {
    socketClient.joinRoom('product', productId);
  }, []);

  const leaveProductRoom = useCallback((productId: string) => {
    socketClient.leaveRoom('product', productId);
  }, []);

  // Notification management
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Ping server
  const ping = useCallback(() => {
    socketClient.ping();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Connection events
    socketClient.on('connection:connected', () => {
      updateConnectionState({ isConnected: true, isConnecting: false, error: null });
    });

    socketClient.on('connection:disconnected', (reason: unknown) => {
      updateConnectionState({ isConnected: false, isConnecting: false });
      console.log('Socket disconnected:', reason);
    });

    socketClient.on('connection:error', (error: { message?: string } | Error | unknown) => {
      const message = (error as any)?.message ?? 'Connection error';
      updateConnectionState({ isConnecting: false, error: message });
    });

    socketClient.on('connection:reconnecting', (attemptNumber: number) => {
      updateConnectionState({ reconnectAttempts: attemptNumber });
    });

    socketClient.on('connection:reconnected', (attemptNumber: number) => {
      updateConnectionState({ isConnected: true, reconnectAttempts: attemptNumber });
    });

    socketClient.on('connection:reconnect_error', (error: { message?: string } | Error | unknown) => {
      const message = (error as any)?.message ?? 'Reconnect error';
      updateConnectionState({ error: message });
    });

    // Notification events
    socketClient.on('notification:received', (notification: SocketNotification) => {
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socketClient.on('notification:system', (notification: SocketNotification) => {
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socketClient.on('notification:admin', (notification: SocketNotification) => {
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Order events
    socketClient.on('order:update', (update: any) => {
      // Convert order update to notification format
      const orderId: string = update?.orderId ?? '';
      const short = typeof orderId === 'string' ? (orderId.includes('_') ? orderId.slice(0, 8).toUpperCase() : orderId.slice(0, 8).toUpperCase()) : '';
      const status: string = update?.status ?? '';
      const notification: SocketNotification = {
        id: `order_${orderId}_${Date.now()}`,
        type: 'ORDER_UPDATE',
        title: 'i18n.notification.orderStatusUpdated',
        message: update?.message || `i18n.notification.orderStatusUpdatedMsg|${short}|${status}`,
        data: update,
        timestamp: update?.timestamp,
        read: false,
      };
      
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    // Product events
    socketClient.on('product:alert', (alert: any) => {
      // Convert product alert to notification format
      const at: string = alert?.alertType ?? '';
      const titleKey = at === 'LOW_STOCK' ? 'i18n.notification.lowStock' : at === 'NEW_PRODUCT' ? 'i18n.notification.newProduct' : 'i18n.notification.systemNotice';
      const notification: SocketNotification = {
        id: `product_${alert?.productId ?? ''}_${Date.now()}`,
        type: 'PRODUCT_ALERT',
        title: titleKey,
        message: alert?.message || (at === 'LOW_STOCK'
          ? `i18n.product.lowStock|${alert?.productName ?? ''}|${alert?.currentStock ?? ''}`
          : at === 'NEW_PRODUCT'
            ? `i18n.product.newProduct|${alert?.productName ?? ''}`
            : `i18n.notification.systemNotice`),
        data: alert,
        timestamp: alert?.timestamp,
        read: false,
      };
      
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    // Ping/pong events
    socketClient.on('connection:pong', (_data: unknown) => {
      setLastPong(new Date());
    });

    // Cleanup
    return () => {
      socketClient.off('connection:connected');
      socketClient.off('connection:disconnected');
      socketClient.off('connection:error');
      socketClient.off('connection:reconnecting');
      socketClient.off('connection:reconnected');
      socketClient.off('connection:reconnect_error');
      socketClient.off('notification:received');
      socketClient.off('notification:system');
      socketClient.off('notification:admin');
      socketClient.off('order:update');
      socketClient.off('product:alert');
      socketClient.off('connection:pong');
    };
  }, [updateConnectionState]);

  // Auto-connect when session is available; also ensure initial page mount connects
  useEffect(() => {
    if (session?.user?.id) {
      connect();
    } else {
      disconnect();
    }
    // also attempt once on mount to cover cases where bell connected first
    // and this page mounts with cached session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!connectionState.isConnected && !connectionState.isConnecting && session?.user?.id) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectionState.isConnected, connectionState.isConnecting, session?.user?.id, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    connectionError: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Room management
    joinOrderRoom,
    leaveOrderRoom,
    joinProductRoom,
    leaveProductRoom,
    
    // Real-time notifications
    notifications,
    unreadCount,
    
    // Actions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    
    // Connection health
    ping,
    lastPong,
  };
}
