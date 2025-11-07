import 'server-only';
import { prisma } from '../../../lib/db';
import type { FaqCategoryWithFaqs, CreateFaqCategoryData, UpdateFaqCategoryData } from './types';

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
 * Create a new FAQ category
 */
export async function createFaqCategory(data: CreateFaqCategoryData): Promise<FaqCategoryWithFaqs> {
  return await prisma.faqCategory.create({
    data: {
      slug: data.slug,
      name: data.name,
      order: data.order || 0,
      active: data.active !== false,
      translations: {
        create: data.translations || [],
      },
    },
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
  });
}

/**
 * Update an existing FAQ category
 */
export async function updateFaqCategory(id: string, data: UpdateFaqCategoryData): Promise<FaqCategoryWithFaqs> {
  return await prisma.faqCategory.update({
    where: { id },
    data: {
      slug: data.slug,
      name: data.name,
      order: data.order,
      active: data.active,
      ...(data.translations && {
        translations: {
          deleteMany: {},
          create: data.translations,
        },
      }),
    },
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
  });
}

/**
 * Delete an FAQ category (and all its FAQs)
 */
export async function deleteFaqCategory(id: string): Promise<void> {
  await prisma.faqCategory.delete({
    where: { id },
  });
}

