'use client';

import { useEffect } from 'react';

const MAX_SHIFT = 6;

export default function KineticHeadings() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const headings = document.querySelectorAll<HTMLElement>('main h1, main h2');
    if (headings.length === 0) return undefined;

    const visible = new Set<HTMLElement>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(el);
            el.style.willChange = 'transform';
          } else {
            visible.delete(el);
            el.style.willChange = 'auto';
            el.style.transform = '';
          }
        }
      },
      { threshold: 0 }
    );

    for (const h of headings) {
      h.style.transition = 'transform 0.15s ease-out';
      observer.observe(h);
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        for (const el of visible) {
          const rect = el.getBoundingClientRect();
          const center = (rect.top + rect.bottom) / 2;
          const norm = (center / vh - 0.5) * 2;
          const shift = norm * MAX_SHIFT;
          el.style.transform = `translateX(${shift}px)`;
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      for (const h of headings) {
        h.style.willChange = '';
        h.style.transform = '';
        h.style.transition = '';
      }
    };
  }, []);

  return null;
}
