'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveInfo {
  const [responsiveInfo, setResponsiveInfo] = useState<ResponsiveInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1920,
    height: 1080,
  });

  useEffect(() => {
    function updateResponsiveInfo() {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;

      setResponsiveInfo({
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
      });
    }

    // Initial detection with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateResponsiveInfo, 100);

    // Listen for resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateResponsiveInfo);
      // Also listen for orientation change on mobile devices
      window.addEventListener('orientationchange', updateResponsiveInfo);
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateResponsiveInfo);
        window.removeEventListener('orientationchange', updateResponsiveInfo);
      }
    };
  }, []);

  return responsiveInfo;
}

// Media query hook for specific breakpoints
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Convenience hooks
export function useMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
