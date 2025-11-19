'use client';

import { useMemo, useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import { useResponsive } from '@/hooks/useResponsive'

type Option = { value: string; label: string };

export function MultiSelect({
  name,
  label,
  options,
  defaultSelected = [],
}: {
  name: string;
  label: string;
  options: Option[];
  defaultSelected?: string[];
}) {
  const { dict } = useI18n();
  const { isMobile } = useResponsive();
  const optionMap = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options]);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const summary = selected.length
    ? selected.slice(0, 2).map(v => optionMap.get(v) ?? v).join(', ') + (selected.length > 2 ? ` +${selected.length - 2}` : '')
    : (dict.common?.multiSelect?.all ?? 'All');

  // Calculate dropdown position
  useEffect(() => {
    if (!buttonRef) return;

    const updatePosition = () => {
      const rect = buttonRef.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (isMobile) {
        // Mobile: Full-width dropdown, positioned relative to viewport (not scroll position)
        // Use fixed positioning relative to viewport for mobile
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const preferredMaxHeight = Math.min(viewportHeight * 0.65, 450);
        
        // Determine if we should show above or below
        const minSpaceRequired = 250;
        const shouldShowAbove = spaceBelow < minSpaceRequired && spaceAbove > spaceBelow;
        
        let top: number;
        let maxHeight: number;
        
        if (shouldShowAbove) {
          // Show above button
          maxHeight = Math.min(spaceAbove - 24, preferredMaxHeight);
          top = rect.top - maxHeight - 8;
        } else {
          // Show below button (default)
          maxHeight = Math.min(spaceBelow - 24, preferredMaxHeight);
          top = rect.bottom + 8;
        }

        // Ensure dropdown stays within viewport bounds
        const minTop = 8;
        const maxTop = viewportHeight - 16;
        const calculatedBottom = top + maxHeight;
        
        if (calculatedBottom > maxTop) {
          // Adjust if dropdown would go below viewport
          top = Math.max(minTop, maxTop - maxHeight);
        }
        if (top < minTop) {
          // Adjust if dropdown would go above viewport
          top = minTop;
          maxHeight = Math.min(maxHeight, viewportHeight - top - 16);
        }

        setDropdownStyle({
          position: 'fixed',
          top: `${top}px`,
          left: '16px',
          right: '16px',
          width: 'auto',
          maxHeight: `${Math.max(250, maxHeight)}px`,
        });
      } else {
        // Desktop: Original positioning logic with scroll offset
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + scrollY + 8}px`,
          left: `${rect.left + scrollX}px`,
          width: `${rect.width}px`,
        });
      }
    };

    updatePosition();
    
    // Update on scroll/resize/orientation change
    const handleUpdate = () => {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('orientationchange', handleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
    };
  }, [buttonRef, isMobile]);

  return (
    <div className="relative">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {/* Hidden inputs for form submission */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      <Listbox value={selected} onChange={setSelected} multiple>
        {({ open }) => {
          return (
            <div className="relative">
              <Listbox.Button 
                ref={setButtonRef}
                className="h-11 w-full rounded-xl border px-3 text-left"
              >
                <span className="block truncate">{summary}</span>
              </Listbox.Button>
          {open && buttonRef && createPortal(
            <>
              {/* Backdrop for mobile */}
              {isMobile && (
                <div 
                  className="fixed inset-0 bg-black/20 animate-in fade-in duration-100"
                  style={{ zIndex: 9998 }}
                  // Headless UI will automatically close when clicking outside Listbox.Options
                />
              )}
              <Transition 
                as="div"
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-100" 
                leaveFrom="opacity-100 scale-100" 
                leaveTo="opacity-0 scale-95"
              >
                <Listbox.Options 
                static
                className={`${
                  isMobile 
                    ? 'rounded-2xl border-2 shadow-2xl mobile-menu-scrollable' 
                    : 'mt-2 w-64 rounded-xl border shadow-xl'
                } overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none`}
                style={{
                  ...dropdownStyle,
                  zIndex: 9999, // Ensure it's above everything including header
                }}
              >
              <div className={`sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-2 py-2 sm:py-1.5 flex flex-wrap sm:flex-nowrap items-center gap-2 ${isMobile ? 'rounded-t-2xl' : ''}`}>
                <button
                  type="button"
                  onClick={() => setSelected(options.map(o => o.value))}
                  className="text-xs sm:text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 sm:py-1 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label={(dict.common?.multiSelect?.selectAllAria ?? 'Select all {{0}}').replace('{{0}}', label)}
                >
                  {dict.common?.multiSelect?.selectAll ?? 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-xs sm:text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 sm:py-1 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label={(dict.common?.multiSelect?.deselectAllAria ?? 'Deselect all {{0}}').replace('{{0}}', label)}
                >
                  {dict.common?.multiSelect?.deselectAll ?? 'Deselect all'}
                </button>
                <span className="ml-auto text-xs sm:text-[11px] text-gray-500 dark:text-slate-400">{
                  (dict.common?.multiSelect?.selectedCount ?? '{{0}}/{{1}} selected')
                    .replace('{{0}}', String(selected.length))
                    .replace('{{1}}', String(options.length))
                }</span>
              </div>
              <div className={isMobile ? 'pb-2' : ''}>
                {options.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2.5 sm:py-2 pl-10 pr-4 text-sm ${
                        active ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                      } ${selected ? 'text-cyan-700 dark:text-cyan-400 font-medium' : 'text-gray-800 dark:text-slate-200'}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{opt.label}</span>
                        <span
                          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${
                            selected ? 'text-cyan-600 dark:text-cyan-400' : 'text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
              </Listbox.Options>
            </Transition>
            </>,
            document.body
          )}
            </div>
          );
        }}
      </Listbox>
    </div>
  );
}


