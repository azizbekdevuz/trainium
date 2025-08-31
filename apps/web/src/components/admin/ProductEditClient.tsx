'use client';

import { useState, useEffect } from 'react';
import { CategoryCreationForm } from './CategoryCreationForm';
import { Badge } from '../ui/badge';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { getCategoryDisplayName, sortCategories } from '../../lib/category-utils';
import { useFormValidation } from '../../hooks/useFormValidation';

interface ProductEditClientProps {
  categories: any[];
  selectedCategories: string[];
  dict: any;
}

export function ProductEditClient({ categories: initialCategories, selectedCategories, dict }: ProductEditClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoriesState, setSelectedCategoriesState] = useState<string[]>(selectedCategories);
  
  // Form validation for required fields
  const { isValid, getValidationMessage } = useFormValidation({
    requiredFields: ['name', 'slug', 'currency', 'price'],
    formId: 'product-edit-form'
  });

  const handleCategoryCreated = (newCategory: any) => {
    setCategories(prev => {
      const updated = [...prev, newCategory];
      return sortCategories(updated, dict);
    });
  };

  // Update categories when dict changes (language switch)
  useEffect(() => {
    setCategories(prev => sortCategories(prev, dict));
  }, [dict]);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    getCategoryDisplayName(category, dict).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategoriesState(prev => 
      prev.includes(categorySlug) 
        ? prev.filter(id => id !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.admin?.products?.categories ?? 'Categories'}
          </span>
          {selectedCategoriesState.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400">
              {selectedCategoriesState.length} {dict.admin?.products?.selected ?? "selected"}
            </Badge>
          )}
        </div>
        <CategoryCreationForm 
          onCategoryCreated={handleCategoryCreated} 
          dict={dict}
          disabled={!isValid}
          disabledReason={getValidationMessage()}
        />
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder={dict.admin?.products?.searchCategories ?? "Search categories..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      {/* Categories grid */}
      <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <div className="p-3 space-y-2">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{dict.admin?.products?.noCategoriesFound ?? 'No categories found'}</p>
              {searchTerm && (
                <p className="text-xs mt-1">{dict.admin?.products?.tryAdjustingSearch ?? 'Try adjusting your search'}</p>
              )}
            </div>
          ) : (
            filteredCategories.map(category => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                  selectedCategoriesState.includes(category.slug)
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => handleCategoryToggle(category.slug)}
              >
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    name="categories" 
                    value={category.slug}
                    checked={selectedCategoriesState.includes(category.slug)}
                    onChange={() => handleCategoryToggle(category.slug)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800"
                  />
                  <span className={`text-sm font-medium ${
                    selectedCategoriesState.includes(category.slug) 
                      ? 'text-cyan-900 dark:text-cyan-100' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {getCategoryDisplayName(category, dict)}
                  </span>
                </div>
                {selectedCategoriesState.includes(category.slug) && (
                  <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400">
                    {dict.admin?.products?.selected ?? "Selected"}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected categories summary */}
      {selectedCategoriesState.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoriesState.map(categorySlug => {
            const category = categories.find(c => c.slug === categorySlug);
            if (!category) return null;
            return (
              <Badge 
                key={categorySlug} 
                variant="secondary" 
                className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/30 cursor-pointer transition-colors"
                onClick={() => handleCategoryToggle(categorySlug)}
              >
                {getCategoryDisplayName(category, dict)} ×
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}