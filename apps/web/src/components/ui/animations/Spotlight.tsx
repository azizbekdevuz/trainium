'use client';

import { useEffect, useRef } from 'react';

type Props = { strength?: number; className?: string };

export default function Spotlight({ className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--x', `${x}px`);
        el.style.setProperty('--y', `${y}px`);
      });
    };

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) el.addEventListener('mousemove', onMove);
    return () => {
      if (!media.matches) el.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        // radial spotlight following cursor
        background:
          'radial-gradient(240px 240px at var(--x, 50%) var(--y, 50%), rgba(14,165,233,.17), transparent 60%)',
        transition: 'background 120ms ease',
        willChange: 'transform',
      }}
      aria-hidden
    />
  );
}