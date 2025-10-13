'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

// Fallback responsive hook that works better with development servers
export function useResponsiveFallback(): ResponsiveInfo {
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
      
      // More aggressive mobile detection for development servers
      const isMobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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

    // Multiple detection methods for better compatibility
    updateResponsiveInfo();
    
    // Immediate detection
    const immediateId = setTimeout(updateResponsiveInfo, 0);
    
    // Delayed detection for development servers
    const delayedId = setTimeout(updateResponsiveInfo, 100);
    
    // Additional delayed detection
    const extraDelayedId = setTimeout(updateResponsiveInfo, 500);

    // Listen for resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateResponsiveInfo);
      window.addEventListener('orientationchange', updateResponsiveInfo);
      
      // Additional event listeners for better mobile detection
      window.addEventListener('load', updateResponsiveInfo);
      document.addEventListener('DOMContentLoaded', updateResponsiveInfo);
    }
    
    return () => {
      clearTimeout(immediateId);
      clearTimeout(delayedId);
      clearTimeout(extraDelayedId);
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateResponsiveInfo);
        window.removeEventListener('orientationchange', updateResponsiveInfo);
        window.removeEventListener('load', updateResponsiveInfo);
        document.removeEventListener('DOMContentLoaded', updateResponsiveInfo);
      }
    };
  }, []);

  return responsiveInfo;
}
