'use client';

import { Fragment, useMemo, useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import { Search, X } from 'lucide-react';

type Option = { value: string; label: string };

export function SearchableMultiSelect({
  name,
  label,
  options,
  defaultSelected = [],
  placeholder = "Search and select...",
}: {
  name: string;
  label: string;
  options: Option[];
  defaultSelected?: string[];
  placeholder?: string;
}) {
  const { dict } = useI18n();
  const optionMap = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options]);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [isOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const summary = selected.length
    ? selected.slice(0, 2).map(v => optionMap.get(v) ?? v).join(', ') + (selected.length > 2 ? ` +${selected.length - 2}` : '')
    : placeholder;

  const handleSelectAll = () => {
    setSelected(filteredOptions.map(o => o.value));
  };

  const handleDeselectAll = () => {
    setSelected([]);
  };

  const handleRemoveSelected = (value: string) => {
    setSelected(prev => prev.filter(v => v !== value));
  };

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
          // useEffect(() => {
          //   if (open !== isOpen) {
          //     setIsOpen(open);
          //   }
          // }, [open, isOpen]);
          
          return (
            <div className="relative">
              <Listbox.Button 
                ref={setButtonRef}
                className="h-11 w-full rounded-xl border px-3 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <span className="block truncate text-gray-700">{summary}</span>
              </Listbox.Button>
              
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                {isOpen && buttonRef && createPortal(
                  <Listbox.Options 
                    static
                    className="fixed z-50 mt-2 max-h-80 w-80 overflow-hidden rounded-xl border bg-white shadow-xl focus:outline-none"
                    style={{
                      top: buttonRef.getBoundingClientRect().bottom + window.scrollY + 8,
                      left: buttonRef.getBoundingClientRect().left + window.scrollX,
                      width: Math.max(buttonRef.getBoundingClientRect().width, 320),
                    }}
                  >
                  {/* Search Header */}
                  <div className="sticky top-0 z-10 bg-white border-b p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs rounded-lg border px-2 py-1 hover:bg-gray-50 transition-colors"
                        >
                          {dict.common?.multiSelect?.selectAll ?? 'Select all'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-xs rounded-lg border px-2 py-1 hover:bg-gray-50 transition-colors"
                        >
                          {dict.common?.multiSelect?.deselectAll ?? 'Deselect all'}
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(dict.common?.multiSelect?.selectedCount ?? '{{0}}/{{1}} selected')
                          .replace('{{0}}', String(selected.length))
                          .replace('{{1}}', String(options.length))}
                      </span>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {filteredOptions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No categories found</p>
                        {searchTerm && (
                          <p className="text-xs mt-1">Try adjusting your search</p>
                        )}
                      </div>
                    ) : (
                      filteredOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 text-sm transition-colors ${
                              active ? 'bg-cyan-50' : ''
                            } ${selected.includes(option.value) ? 'bg-cyan-50 text-cyan-700' : 'text-gray-800'}`
                          }
                        >
                          {({ selected: isSelected }) => (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-cyan-600 border-cyan-600' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`${isSelected ? 'font-medium' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                              </div>
                            </div>
                          )}
                        </Listbox.Option>
                      ))
                    )}
                  </div>
                  </Listbox.Options>,
                  document.body
                )}
              </Transition>
            </div>
          );
        }}
      </Listbox>

      {/* Selected Items Display */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map(value => {
            const label = optionMap.get(value);
            if (!label) return null;
            return (
              <div
                key={value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(value)}
                  className="hover:bg-cyan-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
