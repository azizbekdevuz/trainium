'use client';

import React from 'react';
import { useI18n } from '../providers/I18nProvider';
import { getCategoryDisplayName } from '../../lib/category-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface FaqTranslation {
  id?: string;
  language: string;
  question: string;
  answer: string;
}

interface Faq {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: FaqTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface FaqCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: Faq[];
  translations: any[];
  createdAt: string;
  updatedAt: string;
}

interface FaqFormData {
  categoryId: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    question: string;
    answer: string;
  }[];
}

interface FaqFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFaq: Faq | null;
  categories: FaqCategory[];
  formData: FaqFormData;
  onFormDataChange: (data: FaqFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function FaqForm({
  open,
  onOpenChange,
  editingFaq,
  categories,
  formData,
  onFormDataChange,
  onSubmit,
  saving
}: FaqFormProps) {
  const { t, dict } = useI18n();

  const updateFormData = (updates: Partial<FaqFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  const updateTranslation = (index: number, field: 'question' | 'answer', value: string) => {
    const newTranslations = [...formData.translations];
    newTranslations[index] = { ...newTranslations[index], [field]: value };
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
      title={editingFaq ? t('faq.admin.editFaq') : t('faq.admin.addFaq')}
      footer={footer}
      className="max-w-4xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('common.basicInformation')}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="faqCategory" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => updateFormData({ categoryId: value })}
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="" disabled>{t('faq.admin.placeholders.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryDisplayName(category, dict)}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faqOrder" className="text-sm font-medium">
                {t('faq.admin.faqOrder')}
              </Label>
              <Input
                id="faqOrder"
                type="number"
                value={formData.order}
                onChange={(e) => updateFormData({ order: parseInt(e.target.value) || 0 })}
                placeholder={t('faq.admin.placeholders.faqOrder')}
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Switch
              id="faqActive"
              checked={formData.active}
              onCheckedChange={(checked) => updateFormData({ active: checked })}
              className="data-[state=checked]:bg-cyan-500"
            />
            <Label htmlFor="faqActive" className="text-sm font-medium">
              {t('faq.admin.active')}
            </Label>
          </div>
        </div>
        
        {/* Translations Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('faq.admin.translations')}
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            {formData.translations.map((translation, index) => (
              <div key={translation.language} className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
                  {t(`faq.admin.languages.${translation.language}`)} ({translation.language.toUpperCase()})
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('faq.admin.question')}
                    </Label>
                    <Input
                      value={translation.question}
                      onChange={(e) => updateTranslation(index, 'question', e.target.value)}
                      placeholder={t(`faq.admin.placeholders.question${translation.language.charAt(0).toUpperCase() + translation.language.slice(1)}`)}
                      className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('faq.admin.answer')}
                    </Label>
                    <Textarea
                      value={translation.answer}
                      onChange={(e) => updateTranslation(index, 'answer', e.target.value)}
                      placeholder={t(`faq.admin.placeholders.answer${translation.language.charAt(0).toUpperCase() + translation.language.slice(1)}`)}
                      rows={3}
                      className="text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}
