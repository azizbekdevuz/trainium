'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  hasActionButtons?: boolean;
}

export function Form({ open, onClose, title, children, className = '', hasActionButtons = false }: FormProps) {
  // Handle scroll behavior when form is open
  useEffect(() => {
    if (open) {
      // Store original scroll position and overflow style
      const scrollY = window.scrollY;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      
      // Prevent body scroll when form is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className={`w-full max-w-md max-h-[95vh] rounded-2xl bg-white dark:bg-slate-900 border shadow-2xl flex flex-col ${className}`}>
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-display text-xl text-gray-900 dark:text-slate-100">{title}</h3>
          </div>
          
          {/* Scrollable Content */}
          <div className={`flex-1 overflow-y-auto px-5 ${hasActionButtons ? 'py-4' : 'py-4'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
