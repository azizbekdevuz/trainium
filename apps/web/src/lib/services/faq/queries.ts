import 'server-only';
import { prisma } from '../../../lib/db';
import type { FaqWithTranslations, FaqCategoryWithFaqs } from './types';

const faqTranslationSelect = {
  id: true,
  language: true,
  question: true,
  answer: true,
};

const categoryTranslationSelect = {
  id: true,
  language: true,
  name: true,
};

/**
 * Get all FAQ categories with their FAQs and translations for a specific language
 */
export async function getFaqsByLanguage(language: string): Promise<FaqCategoryWithFaqs[]> {
  return await prisma.faqCategory.findMany({
    where: { active: true },
    include: {
      faqs: {
        where: { active: true },
        include: {
          translations: {
            where: { language },
            select: faqTranslationSelect,
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        where: { language },
        select: categoryTranslationSelect,
      },
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * Get all FAQ categories with all translations (for admin)
 */
export async function getAllFaqCategories(): Promise<FaqCategoryWithFaqs[]> {
  return await prisma.faqCategory.findMany({
    include: {
      faqs: {
        include: {
          translations: {
            select: faqTranslationSelect,
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        select: categoryTranslationSelect,
      },
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * Get a single FAQ with all translations
 */
export async function getFaqById(id: string): Promise<FaqWithTranslations | null> {
  return await prisma.faq.findUnique({
    where: { id },
    include: {
      translations: {
        select: faqTranslationSelect,
      },
    },
  });
}

/**
 * Get a single FAQ category
 */
export async function getFaqCategoryById(id: string): Promise<FaqCategoryWithFaqs | null> {
  return await prisma.faqCategory.findUnique({
    where: { id },
    include: {
      translations: true,
      faqs: {
        include: {
          translations: {
            select: faqTranslationSelect,
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
}

