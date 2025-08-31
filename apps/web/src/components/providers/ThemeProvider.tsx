'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    // Prefer cookie (set server-side for SSR no-flash correctness)
    const match = document.cookie.match(/(?:^|; )theme=([^;]+)/);
    const cookieTheme = match ? decodeURIComponent(match[1]) : undefined;
    if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme as Theme;
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* ignore localStorage/cookie errors */ }
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { window.localStorage.setItem('theme', next); } catch { /* ignore localStorage errors */ }
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `theme=${next}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
    } catch { /* ignore cookie errors */ }
    applyTheme(next);
  }, [applyTheme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      try {
        const stored = window.localStorage.getItem('theme');
        if (stored !== 'light' && stored !== 'dark') {
          setTheme(media.matches ? 'dark' : 'light');
        }
      } catch { /* ignore localStorage errors */ }
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [theme, applyTheme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


