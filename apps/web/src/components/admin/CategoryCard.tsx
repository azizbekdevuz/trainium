'use client';

import React from 'react';
import { useI18n } from '../providers/I18nProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { getCategoryDisplayName } from '../../lib/product/category-utils';
import { Button } from '@/components/ui/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Badge } from '@/components/ui/primitives/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/primitives/dropdown-menu';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus 
} from 'lucide-react';

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
  faqs: Faq[];
  translations: FaqCategoryTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryCardProps {
  category: FaqCategory;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEditCategory: (category: FaqCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddFaq: (categoryId: string) => void;
  onEditFaq: (categoryId: string, faq: Faq) => void;
  onDeleteFaq: (faqId: string) => void;
}

export function CategoryCard({
  category,
  isExpanded,
  onToggleExpanded,
  onEditCategory,
  onDeleteCategory,
  onAddFaq,
  onEditFaq,
  onDeleteFaq
}: CategoryCardProps) {
  const { t, dict } = useI18n();
  const { isMobile } = useResponsive();

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-ui-default dark:border-ui-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 cursor-pointer"
            onClick={onToggleExpanded}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpanded(); } }}
          >
            <div className="p-1 h-8 w-8 flex items-center justify-center rounded-md hover:bg-ui-inset dark:hover:bg-ui-elevated transition-colors duration-200 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-ui-primary truncate">
                {getCategoryDisplayName(category, dict)}
              </CardTitle>
              
              {/* Category Translations - Hide on mobile to save space */}
              {!isMobile && (
                <div className="space-y-1 mt-2">
                  {category.translations.map((translation) => (
                    <div key={translation.id} className="text-sm">
                      <span className="font-medium text-ui-muted dark:text-ui-faint">
                        [{translation.language.toUpperCase()}] {translation.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Status and Count */}
              <div className="flex items-center space-x-2 mt-3">
                <Badge 
                  variant={category.active ? 'default' : 'secondary'}
                  className={category.active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}
                >
                  {category.active ? t('faq.admin.active') : t('faq.admin.inactive')}
                </Badge>
                <span className="text-sm text-ui-faint dark:text-ui-faint">
                  {category.faqs.length} {t('faq.admin.faqs', "FAQs")}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              onClick={() => onAddFaq(category.id)}
              className={`transition-all duration-200 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-900/20 ${isMobile ? 'w-full text-xs' : ''}`}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {t('faq.admin.addFaq')}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isMobile ? 'w-full' : 'h-10 w-10 p-0'} hover:bg-ui-inset dark:hover:bg-ui-elevated`}
                >
                  <MoreVertical className="h-5 w-5" />
                  {isMobile && <span className="ml-2 text-xs">{t('faq.admin.actions', 'Actions')}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent >
                <DropdownMenuItem onClick={() => onEditCategory(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('faq.admin.editCategory')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteCategory(category.id)}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('faq.admin.deleteCategory', "Delete Category")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0">
          {category.faqs.length === 0 ? (
            <div className="text-center py-8 text-ui-faint dark:text-ui-faint">
              <p className="text-sm">{t('faq.admin.noFaqs', "No FAQs found in this category")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {category.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 border border-ui-default dark:border-ui-subtle rounded-lg bg-ui-inset dark:bg-ui-elevated/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        {faq.translations.map((translation) => (
                          <div key={translation.language} className="space-y-1">
                            <h4 className="text-sm font-medium text-ui-primary">
                              [{translation.language.toUpperCase()}] {translation.question}
                            </h4>
                            <p className="text-sm text-ui-muted dark:text-ui-faint line-clamp-2">
                              {translation.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge 
                          variant={faq.active ? 'default' : 'secondary'}
                          className={faq.active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}
                        >
                          {faq.active ? t('faq.admin.active', "Active") : t('faq.admin.inactive', "Inactive")}
                        </Badge>
                        <span className="text-xs text-ui-faint dark:text-ui-faint">
                          {t('faq.admin.faqOrder', "Order")}: {faq.order}
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-ui-inset dark:hover:bg-ui-inset"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent >
                        <DropdownMenuItem onClick={() => onEditFaq(category.id, faq)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('faq.admin.editFaq', "Edit FAQ")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteFaq(faq.id)}
                          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('faq.admin.deleteFaq', "Delete FAQ")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
