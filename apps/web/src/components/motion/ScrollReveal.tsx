'use client';

import { useEffect } from 'react';

const SECTION_SELECTOR = 'main > section, main > div > section, main > div > div > .glass-surface';
const THRESHOLD = 0.1;

export default function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const sections = document.querySelectorAll<HTMLElement>(SECTION_SELECTOR);
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: THRESHOLD }
    );

    for (const el of sections) {
      if (el.closest('[data-no-reveal]')) continue;
      el.classList.add('reveal-init');
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
