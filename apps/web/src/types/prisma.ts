import { Product, Category, ProductVariant, Inventory } from '@prisma/client';

// Updated to include inventory for low stock badges
export type ProductWithRelations = Product & {
  categories: Category[];
  variants: ProductVariant[];
  inventory?: Inventory | null;
};