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
      className="relative h-9 w-9 rounded-lg border text-sm flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition"
    >
      {/* Sun / Moon icon */}
      <SunIcon className="absolute transition-opacity text-amber-500 dark:opacity-0 w-4 h-4" />
      <MoonIcon className="absolute transition-opacity text-cyan-300 opacity-0 dark:opacity-100 w-4 h-4" />
    </button>
  );
}


