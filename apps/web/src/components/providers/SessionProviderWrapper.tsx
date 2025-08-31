'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ReactNode, useEffect } from 'react';

export default function SessionProviderWrapper({ children, initialSession }: { children: ReactNode; initialSession?: Session | null }) {
  // Pause animations when tab is hidden
  useEffect(() => {
    const onVisibility = () => {
      const paused = document.hidden;
      document.documentElement.style.setProperty('--anim-paused', paused ? 'paused' : 'running');
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <SessionProvider
      session={initialSession as any}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}