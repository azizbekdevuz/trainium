'use client';

import { useEffect, useRef } from 'react';

export default function MagneticButton({ children, className = '', ...rest }: React.ComponentProps<'a'>) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const parent = el.parentElement!;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.min(1, Math.hypot(dx, dy) / 160);
      const mx = (dx / 12) * (1 - dist);
      const my = (dy / 12) * (1 - dist);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (el.style.transform = `translate(${mx}px, ${my}px)`));
    };
    const onLeave = () => (el.style.transform = 'translate(0,0)');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) {
      parent.addEventListener('mousemove', onMove);
      parent.addEventListener('mouseleave', onLeave);
    }
    return () => {
      if (!media.matches) {
        parent.removeEventListener('mousemove', onMove);
        parent.removeEventListener('mouseleave', onLeave);
      }
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <a ref={ref} className={`rounded-2xl px-5 py-3 transition will-change-transform ${className}`} {...rest}>
      {children}
    </a>
  );
}