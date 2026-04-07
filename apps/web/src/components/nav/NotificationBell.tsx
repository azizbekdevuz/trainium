'use client';

import type { CSSProperties } from 'react';
import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useSocketNotifications } from '../providers/SocketNotificationsProvider';
import { useI18n } from '../providers/I18nProvider';
import { useDbNotifications } from '@/lib/notifications/hooks/useDbNotifications';
import { NotificationPanel } from './notifications/NotificationPanel';
import { deduplicateNotifications } from '@/lib/notifications/deduplicate';

export function NotificationBell() {
  const { data: session } = useSession();
  const { dict, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>(() => ({
    position: 'fixed',
    top: 72,
    right: 12,
    width: 320,
    maxHeight: 'min(70dvh, 24rem)',
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isConnected,
    notifications: socketNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocketNotifications();

  const {
    dbNotifications,
    markDbAsRead,
    markAllDbAsRead,
    fetchDbNotifications,
  } = useDbNotifications({ userId: session?.user?.id });

  useEffect(() => {
    if (isConnected) {
      fetchDbNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleMarkAsRead = (notificationIds: string[]) => {
    notificationIds.forEach((id) => {
      if (socketNotifications.some((n) => n.id === id)) {
        markNotificationAsRead(id);
      }
    });

    const dbIds = notificationIds.filter((id) => dbNotifications.some((n) => n.id === id));
    if (dbIds.length > 0) {
      markDbAsRead(dbIds);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    markAllDbAsRead();
  };

  const allNotifications = useMemo(
    () => deduplicateNotifications(socketNotifications, dbNotifications),
    [socketNotifications, dbNotifications],
  );

  const totalUnreadCount = useMemo(
    () => allNotifications.filter((n) => !n.read).length,
    [allNotifications],
  );

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return undefined;
    }
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margin = 12;
      const vw = window.innerWidth;
      const rightAligned = Math.min(320, Math.max(0, rect.right - margin));
      if (rightAligned >= 220) {
        setPanelStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          right: vw - rect.right,
          width: rightAligned,
          maxHeight: 'min(70dvh, 24rem)',
        });
      } else {
        setPanelStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: margin,
          right: margin,
          width: 'auto',
          maxHeight: 'min(70dvh, 24rem)',
        });
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, allNotifications.length, totalUnreadCount]);

  if (!session?.user?.id) {
    return null;
  }

  const panel = (
    <NotificationPanel
      notifications={allNotifications}
      isConnected={isConnected}
      totalUnreadCount={totalUnreadCount}
      lang={lang}
      dict={dict}
      userEmail={session.user.email}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onClose={() => setIsOpen(false)}
      fixedPanelStyle={panelStyle}
    />
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-ui-muted hover:text-ui-primary transition-colors"
        aria-expanded={isOpen}
        aria-label={dict.notifications?.bellTitle ?? 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
        <div className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      </button>

      {isOpen && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
