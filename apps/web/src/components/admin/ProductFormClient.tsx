'use client';

import { useState, useEffect } from 'react';
import { CategoryCreationForm } from './CategoryCreationForm';
import { getCategoryDisplayName, sortCategories } from '../../lib/category-utils';
import { Badge } from '../ui/badge';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { useFormValidation } from '../../hooks/useFormValidation';

interface ProductFormClientProps {
  categories: any[];
  dict: any;
  children: React.ReactNode;
}

export function ProductFormClient({ categories: initialCategories, dict, children }: ProductFormClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Form validation for required fields
  const { isValid, getValidationMessage } = useFormValidation({
    requiredFields: ['name', 'slug', 'currency', 'price'],
    formId: 'product-form'
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

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <>
      {children}
      <div className="space-y-4">
        {/* Header with search and add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {dict.admin?.products?.categories ?? 'Categories'}
            </span>
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCategories.length} selected
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Categories grid */}
        <div className="max-h-80 overflow-y-auto border rounded-lg bg-gray-50/50">
          <div className="p-3 space-y-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No categories found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try adjusting your search</p>
                )}
              </div>
            ) : (
              filteredCategories.map(category => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                    selectedCategories.includes(category.id)
                      ? 'bg-cyan-50 border-cyan-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="categories" 
                      value={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                    />
                    <span className={`text-sm font-medium ${
                      selectedCategories.includes(category.id) ? 'text-cyan-900' : 'text-gray-700'
                    }`}>
                      {getCategoryDisplayName(category, dict)}
                    </span>
                  </div>
                  {selectedCategories.includes(category.id) && (
                    <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                      Selected
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected categories summary */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              if (!category) return null;
              return (
                <Badge 
                  key={categoryId} 
                  variant="secondary" 
                  className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 cursor-pointer"
                  onClick={() => handleCategoryToggle(categoryId)}
                >
                  {getCategoryDisplayName(category, dict)} ×
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}