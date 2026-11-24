import type { Product, Category, ProductVariant, Inventory } from '@/generated/prisma/browser';

// Updated to include inventory for low stock badges
export type ProductWithRelations = Product & {
  categories: Category[];
  variants: ProductVariant[];
  inventory?: Inventory | null;
};