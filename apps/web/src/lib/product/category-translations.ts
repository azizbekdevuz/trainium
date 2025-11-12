import fs from 'fs/promises';
import path from 'path';
import type { Dictionary } from '../i18n/i18n';

type Dict = Dictionary;

interface CategoryTranslation {
  name: string;
  slug: string;
  order: number;
  active?: boolean;
  translations: {
    en: string;
    ko: string;
    uz: string;
  };
}

/**
 * Safely updates JSON locale files with new category translations
 * This function ensures JSON syntax is preserved and handles errors gracefully
 */
export async function addCategoryTranslation(categoryData: CategoryTranslation): Promise<boolean> {
  const locales = ['en', 'ko', 'uz'] as const;
  const basePath = path.join(process.cwd(), 'src', 'locales');
  
  try {
    // Process each locale file
    for (const locale of locales) {
      const filePath = path.join(basePath, `${locale}.json`);
      
      try {
        // Read current file content
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Ensure productCategories exists
        if (!data.productCategories) {
          data.productCategories = {};
        }
        
        // Add the new category translation
        data.productCategories[categoryData.slug] = categoryData.translations[locale];
        
        // Write back to file with proper formatting
        const updatedContent = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, updatedContent, 'utf-8');
        
        console.log(`✅ Updated ${locale}.json with category: ${categoryData.slug}`);
      } catch (fileError) {
        console.error(`❌ Error updating ${locale}.json:`, fileError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in addCategoryTranslation:', error);
    return false;
  }
}

/**
 * Gets category translation for a specific locale
 */
export function getCategoryTranslation(slug: string, locale: string, dict: Dict): string {
  // First try to get from productCategories in dict
  if (dict.productCategories?.[slug]) {
    return dict.productCategories[slug];
  }
  
  // Fallback to category name from database
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Validates category translation data
 */
export function validateCategoryTranslation(data: any): data is CategoryTranslation {
  return (
    data &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.slug === 'string' &&
    data.slug.trim().length > 0 &&
    typeof data.order === 'number' &&
    data.order >= 0 &&
    (data.active === undefined || typeof data.active === 'boolean') &&
    data.translations &&
    typeof data.translations.en === 'string' &&
    data.translations.en.trim().length > 0 &&
    typeof data.translations.ko === 'string' &&
    data.translations.ko.trim().length > 0 &&
    typeof data.translations.uz === 'string' &&
    data.translations.uz.trim().length > 0
  );
}
