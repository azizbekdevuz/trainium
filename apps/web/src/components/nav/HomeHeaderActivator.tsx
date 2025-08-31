'use client';

import { useEffect } from 'react';

export default function HomeHeaderActivator() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const header = document.querySelector<HTMLElement>('.site-header');
      if (header) {
        const h = header.getBoundingClientRect().height;
        root.style.setProperty('--home-header-h', `${Math.ceil(h)}px`);
      }
    };

    const onScroll = () => {
      if (window.scrollY > 0) {
        root.classList.add('home-fixed-header');
      } else {
        root.classList.remove('home-fixed-header');
      }
    };

    update();
    onScroll();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    const header = document.querySelector<HTMLElement>('.site-header');
    if (header) ro.observe(header);

    return () => {
      root.classList.remove('home-fixed-header');
      root.style.removeProperty('--home-header-h');
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  return null;
}


