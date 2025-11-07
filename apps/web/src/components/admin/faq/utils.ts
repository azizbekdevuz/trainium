import type { CategoryFormData, FaqFormData, FaqCategory, Faq } from './types';

export function getInitialCategoryForm(): CategoryFormData {
  return {
    name: '',
    slug: '',
    order: 0,
    active: true,
    translations: [
      { language: 'en', name: '' },
      { language: 'ko', name: '' },
      { language: 'uz', name: '' }
    ]
  };
}

export function getInitialFaqForm(categoryId: string = ''): FaqFormData {
  return {
    categoryId,
    order: 0,
    active: true,
    translations: [
      { language: 'en', question: '', answer: '' },
      { language: 'ko', question: '', answer: '' },
      { language: 'uz', question: '', answer: '' }
    ]
  };
}

export function categoryToFormData(category: FaqCategory): CategoryFormData {
  return {
    name: category.name,
    slug: category.slug,
    order: category.order,
    active: category.active,
    translations: [
      { language: 'en', name: category.translations.find(t => t.language === 'en')?.name || '' },
      { language: 'ko', name: category.translations.find(t => t.language === 'ko')?.name || '' },
      { language: 'uz', name: category.translations.find(t => t.language === 'uz')?.name || '' }
    ]
  };
}

export function faqToFormData(faq: Faq): FaqFormData {
  return {
    categoryId: faq.categoryId,
    order: faq.order,
    active: faq.active,
    translations: [
      { language: 'en', question: faq.translations.find(t => t.language === 'en')?.question || '', answer: faq.translations.find(t => t.language === 'en')?.answer || '' },
      { language: 'ko', question: faq.translations.find(t => t.language === 'ko')?.question || '', answer: faq.translations.find(t => t.language === 'ko')?.answer || '' },
      { language: 'uz', question: faq.translations.find(t => t.language === 'uz')?.question || '', answer: faq.translations.find(t => t.language === 'uz')?.answer || '' }
    ]
  };
}

