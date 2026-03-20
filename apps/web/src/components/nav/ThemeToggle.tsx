'use client';

import { useTheme } from '../providers/ThemeProvider';
import { useState } from 'react';
import { SunIcon, MoonIcon } from '../ui/media/Icon';

export default function ThemeToggle() {
  const { toggle } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={pressed}
      onClick={() => { setPressed(p => !p); toggle(); }}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] text-sm transition hover:bg-black/5 dark:hover:bg-ui-inset"
    >
      {/* Sun / Moon icon */}
      <SunIcon className="absolute transition-opacity text-amber-500 dark:opacity-0 w-4 h-4" />
      <MoonIcon className="absolute transition-opacity text-cyan-300 opacity-0 dark:opacity-100 w-4 h-4" />
    </button>
  );
}


