'use client';

import { motion } from 'framer-motion';

type CuteMascotProps = {
  className?: string;
};

// A tiny, friendly mascot (bear) with subtle animations.
// Keeps things professional: minimal lines, soft motion, theme-aware via currentColor.
export default function CuteMascot({ className = 'h-28 w-28' }: CuteMascotProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      className={className}
      aria-hidden
      initial={{ scale: 0.98, rotate: -0.5 }}
      animate={{ scale: [0.98, 1.0, 0.98], rotate: [ -0.5, 0.5, -0.5 ] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Face circle */}
      <circle cx="64" cy="70" r="38" fill="currentColor" opacity="0.06" />
      <circle cx="64" cy="68" r="34" fill="currentColor" opacity="0.1" />
      <circle cx="64" cy="66" r="30" fill="currentColor" opacity="0.12" />

      {/* Ears */}
      <motion.circle cx="40" cy="34" r="12" fill="currentColor" opacity="0.15"
        animate={{ y: [0, -1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="88" cy="34" r="12" fill="currentColor" opacity="0.15"
        animate={{ y: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }} />

      {/* Head */}
      <circle cx="64" cy="64" r="28" fill="currentColor" opacity="0.08" />
      <circle cx="64" cy="64" r="26" fill="currentColor" opacity="0.12" />

      {/* Eyes */}
      <motion.circle cx="53" cy="61" r="3" fill="currentColor"
        animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.05, 0.1] }} />
      <motion.circle cx="75" cy="61" r="3" fill="currentColor"
        animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut', times: [0, 0.05, 0.1], delay: 0.25 }} />

      {/* Nose/mouth */}
      <circle cx="64" cy="70" r="4" fill="currentColor" opacity="0.85" />
      <path d="M60 74 Q64 78 68 74" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
    </motion.svg>
  );
}


