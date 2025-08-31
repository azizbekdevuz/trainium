'use client';

import { useState, useEffect } from 'react';
import { Form } from '../ui/Form';
import { Plus, Loader2 } from 'lucide-react';

interface CategoryCreationFormProps {
  onCategoryCreated: (category: any) => void;
  dict: any;
  disabled?: boolean;
  disabledReason?: string;
}

export function CategoryCreationForm({ onCategoryCreated, dict, disabled = false, disabledReason }: CategoryCreationFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    order: 0,
    translations: {
      en: '',
      ko: '',
      uz: ''
    }
  });

  // Prevent parent form submission when modal is open
  useEffect(() => {
    if (open) {
      const handleFormSubmit = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.closest('#category-creation-form')) {
          return; // Allow our form to submit
        }
        // Prevent any other form submission
        e.preventDefault();
        e.stopPropagation();
      };

      document.addEventListener('submit', handleFormSubmit, true);
      return () => {
        document.removeEventListener('submit', handleFormSubmit, true);
      };
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    if (!formData.name || !formData.slug) return;
    
    // Prevent submission if the parent form is disabled
    if (disabled) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const { category } = await response.json();
      onCategoryCreated(category);
      
      // Reset form
      setFormData({ 
        name: '', 
        slug: '', 
        order: 0,
        translations: { en: '', ko: '', uz: '' }
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
      // You could add toast notification here
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      translations: {
        en: name,
        ko: name,
        uz: name
      }
    }));
  };

  const handleTranslationChange = (locale: 'en' | 'ko' | 'uz', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: value
      }
    }));
  };

  return (
    <>
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 h-9 px-4 ${
          disabled 
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50' 
            : 'bg-cyan-600 hover:bg-cyan-700 text-white'
        }`}
        title={disabled ? disabledReason : undefined}
      >
        <Plus className="h-4 w-4 mr-2" />
        {dict.admin?.products?.addNewCategory ?? 'Add New Category'}
      </button>

      <Form 
        open={open} 
        onClose={() => setOpen(false)} 
        title={dict.admin?.products?.addNewCategory ?? 'Add New Category'}
        className="max-w-lg"
        hasActionButtons={false}
      >
        <form id="category-creation-form" onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-gray-700 dark:text-slate-300">
            {dict.admin?.products?.newCategoryName ?? 'Category Name'}
            <input 
              value={formData.name}
              onChange={handleNameChange}
              placeholder={dict.admin?.products?.categoryNamePlaceholder ?? "e.g., Smart Equipment"}
              className="mt-1 h-10 w-full rounded-xl border px-3" 
              required
            />
          </label>
          
          <label className="block text-sm text-gray-700 dark:text-slate-300">
            {dict.admin?.products?.newCategorySlug ?? 'Category Slug'}
            <input 
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder={dict.admin?.products?.categorySlugPlaceholder ?? "e.g., smart-equipment"}
              className="mt-1 h-10 w-full rounded-xl border px-3" 
              required
            />
            <p className="mt-1 text-xs text-gray-500">{dict.admin?.products?.urlFriendlyIdentifier ?? "URL-friendly identifier (auto-generated from name)"}</p>
          </label>
          
          <label className="block text-sm text-gray-700 dark:text-slate-300">
            {dict.admin?.products?.newCategoryOrder ?? 'Display Order'}
            <input 
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
              className="mt-1 h-10 w-full rounded-xl border px-3" 
            />
            <p className="mt-1 text-xs text-gray-500">{dict.admin?.products?.lowerNumbersFirst ?? "Lower numbers appear first in lists"}</p>
          </label>

          {/* Translation Fields */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              {dict.admin?.products?.translations ?? 'Translations'}
            </h4>
            
            <div className="space-y-3">
              <label className="block text-sm text-gray-700 dark:text-slate-300">
                {dict.admin?.products?.english ?? 'English'}
                <input 
                  value={formData.translations.en}
                  onChange={(e) => handleTranslationChange('en', e.target.value)}
                  placeholder={dict.admin?.products?.categoryNameInEnglish ?? "Category name in English"}
                  className="mt-1 h-9 w-full rounded-xl border px-3" 
                />
              </label>
              
              <label className="block text-sm text-gray-700 dark:text-slate-300">
                {dict.admin?.products?.korean ?? '한국어 (Korean)'}
                <input 
                  value={formData.translations.ko}
                  onChange={(e) => handleTranslationChange('ko', e.target.value)}
                  placeholder={dict.admin?.products?.categoryNameInKorean ?? "Category name in Korean"}
                  className="mt-1 h-9 w-full rounded-xl border px-3" 
                />
              </label>
              
              <label className="block text-sm text-gray-700 dark:text-slate-300">
                {dict.admin?.products?.uzbek ?? "O'zbek (Uzbek)"}
                <input 
                  value={formData.translations.uz}
                  onChange={(e) => handleTranslationChange('uz', e.target.value)}
                  placeholder={dict.admin?.products?.categoryNameInUzbek ?? "Category name in Uzbek"}
                  className="mt-1 h-9 w-full rounded-xl border px-3" 
                />
              </label>
            </div>
          </div>
          
          {/* Action Buttons inside form */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-6 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {dict.admin?.products?.cancel ?? 'Cancel'}
              </button>
              <button 
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e);
                }}
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-50 flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {dict.admin?.products?.createCategory ?? 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
