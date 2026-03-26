'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ReactNode, useEffect } from 'react';

function sessionSyncKey(session: Session | null | undefined): string {
  const u = session?.user as { id?: string; email?: string | null; role?: string } | undefined;
  if (!u) return 'anon';
  return [u.id ?? '', u.email ?? '', u.role ?? ''].join(':');
}

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

  const providerKey = sessionSyncKey(initialSession ?? null);

  return (
    <SessionProvider
      key={providerKey}
      session={initialSession as Session | null}
      refetchOnWindowFocus
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}