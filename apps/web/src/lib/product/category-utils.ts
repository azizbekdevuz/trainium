/**
 * Utility functions for handling product categories
 */

import type { Dictionary } from '../i18n/i18n';

/**
 * Get the translated category name based on the current locale
 * Falls back to the category's default name if translation is not found
 */
export function getCategoryName(
  categorySlug: string,
  categoryName: string,
  dict: Dictionary
): string {
  // Try to get translation from dictionary
  const translatedName = dict?.productCategories?.[categorySlug];
  
  // Fall back to the category's default name if translation not found
  return translatedName || categoryName;
}

/**
 * Get category display name with fallback chain:
 * 1. Translation from dictionary
 * 2. Original category name
 * 3. Formatted slug as last resort
 */
export function getCategoryDisplayName(
  category: { slug: string; name: string },
  dict: Dictionary
): string {
  return getCategoryName(category.slug, category.name, dict);
}

/**
 * Format category slug to readable name (fallback)
 * Example: "exercise-bikes" -> "Exercise Bikes"
 */
export function formatCategorySlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sort categories by a custom order or alphabetically
 */
export function sortCategories<T extends { slug: string; name: string; order?: number }>(
  categories: T[],
  dict: Dictionary,
  sortBy: 'order' | 'name' = 'order'
): T[] {
  if (sortBy === 'order') {
    return [...categories].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by name if orders are equal
      const nameA = getCategoryName(a.slug, a.name, dict);
      const nameB = getCategoryName(b.slug, b.name, dict);
      return nameA.localeCompare(nameB);
    });
  }
  
  return [...categories].sort((a, b) => {
    const nameA = getCategoryName(a.slug, a.name, dict);
    const nameB = getCategoryName(b.slug, b.name, dict);
    return nameA.localeCompare(nameB);
  });
}

/**
 * Group categories by type (for display purposes)
 */
export const CATEGORY_GROUPS = {
  cardio: ['treadmills', 'exercise-bikes', 'ellipticals', 'rowing-machines', 'stair-climbers', 'cross-trainers'],
  strength: ['dumbbells', 'barbells', 'weight-plates', 'kettlebells', 'weight-benches', 'power-racks', 'cable-machines', 'smith-machines', 'functional-trainers'],
  functional: ['trx-suspension', 'battle-ropes', 'medicine-balls', 'sandbags', 'sleds', 'tire-flip'],
  yoga: ['yoga-mats', 'yoga-blocks', 'yoga-straps', 'pilates-reformers', 'yoga-balls', 'yoga-wheels'],
  recovery: ['foam-rollers', 'massage-tools', 'compression-gear', 'recovery-boots', 'ice-baths', 'saunas'],
  accessories: ['workout-gloves', 'weight-belts', 'lifting-straps', 'grip-tools', 'storage-racks', 'flooring', 'mirrors'],
  outdoor: ['resistance-bands', 'portable-equipment', 'outdoor-training', 'water-training'],
  smart: ['smart-equipment', 'fitness-trackers', 'heart-rate-monitors', 'fitness-apps'],
  legacy: ['cardio', 'strength']
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

