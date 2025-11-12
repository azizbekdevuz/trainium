import 'server-only';
import { prisma } from '../../../lib/database/db';
import type { FaqWithTranslations, CreateFaqData, UpdateFaqData } from './types';

const faqTranslationSelect = {
  id: true,
  language: true,
  question: true,
  answer: true,
};

/**
 * Create a new FAQ
 */
export async function createFaq(data: CreateFaqData): Promise<FaqWithTranslations> {
  return await prisma.faq.create({
    data: {
      categoryId: data.categoryId,
      order: data.order || 0,
      translations: {
        create: data.translations.map((t) => ({
          language: t.language,
          question: t.question,
          answer: t.answer,
        })),
      },
    },
    include: {
      translations: {
        select: faqTranslationSelect,
      },
    },
  });
}

/**
 * Update an existing FAQ
 */
export async function updateFaq(id: string, data: UpdateFaqData): Promise<FaqWithTranslations> {
  // If translations are provided, update them
  if (data.translations) {
    // Delete existing translations
    await prisma.faqTranslation.deleteMany({
      where: { faqId: id },
    });

    // Create new translations
    await prisma.faqTranslation.createMany({
      data: data.translations.map((t) => ({
        faqId: id,
        language: t.language,
        question: t.question,
        answer: t.answer,
      })),
    });
  }

  // Update FAQ fields
  return await prisma.faq.update({
    where: { id },
    data: {
      categoryId: data.categoryId,
      order: data.order,
      active: data.active,
    },
    include: {
      translations: {
        select: faqTranslationSelect,
      },
    },
  });
}

/**
 * Delete an FAQ
 */
export async function deleteFaq(id: string): Promise<void> {
  await prisma.faq.delete({
    where: { id },
  });
}

