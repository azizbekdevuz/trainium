'use client';

import { useEffect, useRef } from 'react';

type Props = React.PropsWithChildren<{ max?: number; scale?: number; className?: string }>;

export default function Tilt({ children, max = 10, scale = 1.02, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = (+py * max).toFixed(2);
      const ry = (-px * max).toFixed(2);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
      });
    };
    const onLeave = () => (el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) {
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    }
    return () => {
      if (!media.matches) {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      }
      cancelAnimationFrame(frame);
    };
  }, [max, scale]);

  return <div ref={ref} className={className} style={{ willChange: 'transform' }}>{children}</div>;
}