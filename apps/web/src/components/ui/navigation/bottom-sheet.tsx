'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useResponsive } from '../../../hooks/useResponsive';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../primitives/dialog';
import { Button } from '../primitives/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/format';

/** When to use the mobile bottom sheet vs desktop dialog (default: useResponsive().isMobile, width ≤768). */
function useSheetViewport(sheetMediaQuery: string | undefined, isMobile: boolean) {
  const [matchesQuery, setMatchesQuery] = useState(() => {
    if (typeof window === 'undefined' || !sheetMediaQuery) return false;
    try {
      return window.matchMedia(sheetMediaQuery).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!sheetMediaQuery) {
      return undefined;
    }
    const mq = window.matchMedia(sheetMediaQuery);
    const sync = () => setMatchesQuery(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [sheetMediaQuery]);

  return sheetMediaQuery != null ? matchesQuery : isMobile;
}

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Extra classes on the mobile portal root (`fixed inset-0`). E.g. `z-[100]` when stacking above nav. */
  mobileRootClassName?: string;
  /** Accessible label for the header close control (defaults to "Close"). */
  closeButtonAriaLabel?: string;
  /**
   * `dialog` — below sheet breakpoint: bottom sheet; above: centered dialog (admin FAQ/category forms).
   * `none` — below sheet breakpoint: bottom sheet only; above: render nothing (parent owns desktop UI, e.g. catalog sidebar).
   */
  desktopPresentation?: 'dialog' | 'none';
  /**
   * If set, sheet vs desktop branch follows this media query instead of `useResponsive().isMobile`.
   * Use `(max-width: 1023px)` to match Tailwind `lg` when `desktopPresentation` is `none`.
   */
  sheetMediaQuery?: string;
}

export function BottomSheet({ 
  open, 
  onOpenChange, 
  title, 
  children, 
  footer,
  className = '',
  mobileRootClassName = '',
  closeButtonAriaLabel = 'Close',
  desktopPresentation = 'dialog',
  sheetMediaQuery,
}: BottomSheetProps) {
  const { isMobile } = useResponsive();
  const useSheet = useSheetViewport(sheetMediaQuery, isMobile);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (open && useSheet) {
      document.body.style.overflow = 'hidden';
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    } else if (!open || !useSheet) {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open, useSheet]);

  useEffect(() => {
    if (desktopPresentation === 'none' && !useSheet && open) {
      onOpenChange(false);
    }
  }, [desktopPresentation, useSheet, open, onOpenChange]);

  const handleDragStart = useCallback((clientY: number) => {
    dragging.current = true;
    startY.current = clientY;
    currentY.current = clientY;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragging.current || !sheetRef.current) return;
    currentY.current = clientY;
    const dy = Math.max(0, currentY.current - startY.current);
    sheetRef.current.style.transition = 'none';
    sheetRef.current.style.transform = `translateY(${dy}px)`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragging.current || !sheetRef.current) return;
    dragging.current = false;
    const dy = currentY.current - startY.current;
    sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    if (dy > 80) {
      sheetRef.current.style.transform = 'translateY(100%)';
      setTimeout(() => onOpenChange(false), 300);
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [onOpenChange]);

  if (!useSheet) {
    if (desktopPresentation === 'none') {
      return null;
    }
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-2xl ${className}`}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {children}
          </div>
          {footer && (
            <DialogFooter className="mt-6 pt-4 border-t border-ui-default dark:border-ui-subtle">
              {footer}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (!open) return null;

  return createPortal(
    <div
      className={cn('fixed inset-0', mobileRootClassName || 'z-50')}
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        style={{ zIndex: -1 }}
        aria-hidden
      />
      
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-[90] modal-surface rounded-t-3xl max-h-[95vh] flex flex-col"
        style={{ transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Header — drag zone for swipe-to-close */}
        <div
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          className="touch-none"
        >
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-[var(--border-strong)] rounded-full opacity-60" />
          </div>
          
          <div className="flex items-center justify-between px-5 py-3 border-b border-ui-default dark:border-ui-subtle">
            <h2 className="text-lg font-semibold text-ui-primary">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 p-0 hover:bg-ui-inset dark:hover:bg-ui-elevated rounded-full"
              aria-label={closeButtonAriaLabel}
            >
              <X className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
        
        {/* Content — scrollable, not a drag target */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="border-t border-ui-default dark:border-ui-subtle px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
