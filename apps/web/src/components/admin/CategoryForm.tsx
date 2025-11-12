'use client';

import React from 'react';
import { useI18n } from '../providers/I18nProvider';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Switch } from '@/components/ui/primitives/switch';
import { BottomSheet } from '@/components/ui/navigation/bottom-sheet';

interface FaqCategoryTranslation {
  id: string;
  language: string;
  name: string;
}

interface FaqCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  translations: FaqCategoryTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    name: string;
  }[];
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: FaqCategory | null;
  formData: CategoryFormData;
  onFormDataChange: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function CategoryForm({
  open,
  onOpenChange,
  editingCategory,
  formData,
  onFormDataChange,
  onSubmit,
  saving
}: CategoryFormProps) {
  const { t } = useI18n();
  const formId = 'category-form';

  const updateFormData = (updates: Partial<CategoryFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  const updateTranslation = (index: number, name: string) => {
    const newTranslations = [...formData.translations];
    newTranslations[index] = { ...newTranslations[index], name };
    updateFormData({ translations: newTranslations });
  };

  const footer = (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => onOpenChange(false)}
        className="flex-1 sm:flex-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {t('faq.admin.cancel')}
      </Button>
      <Button 
        type="submit" 
        form={formId}
        disabled={saving}
        className="flex-1 sm:flex-none bg-cyan-500 hover:bg-cyan-600 text-white transition-all duration-200 disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('faq.admin.save')}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <BottomSheet 
      open={open} 
      onOpenChange={onOpenChange}
      title={editingCategory ? t('faq.admin.editCategory') : t('faq.admin.addCategory')}
      footer={footer}
      className="max-w-2xl"
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('common.basicInformation')}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-sm font-medium">
                {t('faq.admin.categoryName')}
              </Label>
              <Input
                id="categoryName"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder={t('faq.admin.placeholders.categoryName')}
                required
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categorySlug" className="text-sm font-medium">
                {t('faq.admin.categorySlug')}
              </Label>
              <Input
                id="categorySlug"
                value={formData.slug}
                onChange={(e) => updateFormData({ slug: e.target.value })}
                placeholder={t('faq.admin.placeholders.categorySlug')}
                required
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryOrder" className="text-sm font-medium">
                {t('faq.admin.categoryOrder')}
              </Label>
              <Input
                id="categoryOrder"
                type="number"
                value={formData.order}
                onChange={(e) => updateFormData({ order: parseInt(e.target.value) || 0 })}
                placeholder={t('faq.admin.placeholders.categoryOrder')}
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            
            <div className="flex items-center space-x-3 pt-6">
              <Switch
                id="categoryActive"
                checked={formData.active}
                onCheckedChange={(checked) => updateFormData({ active: checked })}
                className="data-[state=checked]:bg-cyan-500"
              />
              <Label htmlFor="categoryActive" className="text-sm font-medium">
                {t('faq.admin.active')}
              </Label>
            </div>
          </div>
        </div>
        
        {/* Translations Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('faq.admin.translations')}
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            {formData.translations.map((translation, index) => (
              <div key={translation.language} className="space-y-2 p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t(`faq.admin.languages.${translation.language}`)} ({translation.language.toUpperCase()})
                </Label>
                <Input
                  value={translation.name}
                  onChange={(e) => updateTranslation(index, e.target.value)}
                  placeholder={t(`faq.admin.placeholders.categoryName`)}
                  className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            ))}
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}
