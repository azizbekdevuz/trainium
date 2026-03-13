'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSocket } from '../../hooks/useSocket';
import type { UseSocketReturn } from '../../hooks/useSocket';

const SocketNotificationsContext = createContext<UseSocketReturn | null>(null);

export function SocketNotificationsProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();
  return (
    <SocketNotificationsContext.Provider value={socket}>
      {children}
    </SocketNotificationsContext.Provider>
  );
}

export function useSocketNotifications(): UseSocketReturn {
  const ctx = useContext(SocketNotificationsContext);
  if (!ctx) {
    throw new Error('useSocketNotifications must be used within SocketNotificationsProvider');
  }
  return ctx;
}
