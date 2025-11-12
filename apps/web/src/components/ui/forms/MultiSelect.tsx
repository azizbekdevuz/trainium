'use client';

import { Fragment, useMemo, useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';

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
  const optionMap = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options]);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [isOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  // Handle scroll behavior when dropdown is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow style
      const originalOverflow = document.body.style.overflow;
      
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden';
      
      // Add event listener to handle scroll prevention
      const handleWheel = (e: WheelEvent) => {
        // Allow scrolling within the dropdown, prevent page scroll
        const target = e.target as Element;
        const dropdown = target.closest('[role="listbox"]');
        if (!dropdown) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('wheel', handleWheel, { passive: false });
      
      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  const summary = selected.length
    ? selected.slice(0, 2).map(v => optionMap.get(v) ?? v).join(', ') + (selected.length > 2 ? ` +${selected.length - 2}` : '')
    : (dict.common?.multiSelect?.all ?? 'All');

  return (
    <div className="relative">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {/* Hidden inputs for form submission */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      <Listbox value={selected} onChange={setSelected} multiple>
        {({ open: _open }) => {
          // Update isOpen state when dropdown state changes (use useEffect to avoid setState during render)
          
          return (
            <div className="relative">
              <Listbox.Button 
                ref={setButtonRef}
                className="h-11 w-full rounded-xl border px-3 text-left"
              >
                <span className="block truncate">{summary}</span>
              </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            {isOpen && buttonRef && createPortal(
              <Listbox.Options 
                static
                className="fixed z-50 mt-2 max-h-72 w-64 overflow-y-auto overflow-x-hidden rounded-xl border bg-white shadow-xl focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{
                  top: buttonRef.getBoundingClientRect().bottom + window.scrollY + 8,
                  left: buttonRef.getBoundingClientRect().left + window.scrollX,
                  width: buttonRef.getBoundingClientRect().width,
                }}
              >
              <div className="sticky top-0 z-10 bg-white border-b px-2 py-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(options.map(o => o.value))}
                  className="text-[11px] rounded-lg border px-2 py-1 hover:bg-gray-50"
                  aria-label={(dict.common?.multiSelect?.selectAllAria ?? 'Select all {{0}}').replace('{{0}}', label)}
                >
                  {dict.common?.multiSelect?.selectAll ?? 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-[11px] rounded-lg border px-2 py-1 hover:bg-gray-50"
                  aria-label={(dict.common?.multiSelect?.deselectAllAria ?? 'Deselect all {{0}}').replace('{{0}}', label)}
                >
                  {dict.common?.multiSelect?.deselectAll ?? 'Deselect all'}
                </button>
                <span className="ml-auto text-[11px] text-gray-500">{
                  (dict.common?.multiSelect?.selectedCount ?? '{{0}}/{{1}} selected')
                    .replace('{{0}}', String(selected.length))
                    .replace('{{1}}', String(options.length))
                }</span>
              </div>
              {options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  className={({ active, selected }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm ${
                      active ? 'bg-cyan-50' : ''
                    } ${selected ? 'text-cyan-700' : 'text-gray-800'}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{opt.label}</span>
                      <span
                        className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${
                          selected ? 'text-cyan-600' : 'text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </>
                  )}
                </Listbox.Option>
              ))}
              </Listbox.Options>,
              document.body
            )}
          </Transition>
            </div>
          );
        }}
      </Listbox>
    </div>
  );
}


