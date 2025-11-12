import { prisma } from '../../../../../lib/database/db';
import { sortCategories } from '../../../../../lib/product/category-utils';
import type { Dictionary } from '../../../../../lib/i18n/i18n';

/**
 * Fetch product edit page data
 */
export async function getProductEditData(id: string, dict: Dictionary) {
  const [product, rawCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { categories: true, variants: true, inventory: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  
  // Sort categories with translated names
  const categories = sortCategories(rawCategories, dict);
  
  return { product, categories };
}

