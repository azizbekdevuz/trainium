import 'server-only';
import { prisma } from '../../../lib/database/db';

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

