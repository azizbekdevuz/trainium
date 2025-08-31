import 'server-only';
import { prisma } from '../../lib/db';

export interface FaqWithTranslations {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: {
    id: string;
    language: string;
    question: string;
    answer: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqCategoryWithFaqs {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: FaqWithTranslations[];
  translations: {
    id: string;
    language: string;
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFaqData {
  categoryId: string;
  order?: number;
  translations: {
    language: string;
    question: string;
    answer: string;
  }[];
}

export interface UpdateFaqData {
  categoryId?: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    question: string;
    answer: string;
  }[];
}

export interface CreateFaqCategoryData {
  slug: string;
  name: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    name: string;
  }[];
}

export interface UpdateFaqCategoryData {
  slug?: string;
  name?: string;
  order?: number;
  active?: boolean;
  translations?: {
    language: string;
    name: string;
  }[];
}

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
            select: {
              id: true,
              language: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        where: { language },
        select: {
          id: true,
          language: true,
          name: true,
        },
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
            select: {
              id: true,
              language: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        select: {
          id: true,
          language: true,
          name: true,
        },
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
        select: {
          id: true,
          language: true,
          question: true,
          answer: true,
        },
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
            select: {
              id: true,
              language: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
}

/**
 * Create a new FAQ
 */
export async function createFaq(data: CreateFaqData): Promise<FaqWithTranslations> {
  return await prisma.faq.create({
    data: {
      categoryId: data.categoryId,
      order: data.order || 0,
      translations: {
        create: data.translations.map(t => ({
          language: t.language,
          question: t.question,
          answer: t.answer,
        })),
      },
    },
    include: {
      translations: {
        select: {
          id: true,
          language: true,
          question: true,
          answer: true,
        },
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
      data: data.translations.map(t => ({
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
        select: {
          id: true,
          language: true,
          question: true,
          answer: true,
        },
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
        create: data.translations || []
      },
    },
    include: {
      faqs: {
        include: {
          translations: {
            select: {
              id: true,
              language: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        select: {
          id: true,
          language: true,
          name: true,
        },
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
          create: data.translations
        }
      }),
    },
    include: {
      faqs: {
        include: {
          translations: {
            select: {
              id: true,
              language: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      translations: {
        select: {
          id: true,
          language: true,
          name: true,
        },
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

/**
 * Reorder FAQs within a category
 */
export async function reorderFaqs(faqIds: string[]): Promise<void> {
  await Promise.all(
    faqIds.map((id, index) =>
      prisma.faq.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}

/**
 * Reorder FAQ categories
 */
export async function reorderFaqCategories(categoryIds: string[]): Promise<void> {
  await Promise.all(
    categoryIds.map((id, index) =>
      prisma.faqCategory.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}
