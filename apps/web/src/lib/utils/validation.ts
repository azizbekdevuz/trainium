import { VALIDATION_RULES, ERROR_MESSAGES } from '../../types/api';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates category slug format
 */
export function validateSlug(slug: string): ValidationResult {
  const errors: string[] = [];
  
  if (!slug || typeof slug !== 'string') {
    errors.push('Slug is required');
    return { isValid: false, errors };
  }
  
  const trimmedSlug = slug.trim();
  
  if (trimmedSlug.length < VALIDATION_RULES.CATEGORY_SLUG.MIN_LENGTH) {
    errors.push(`Slug must be at least ${VALIDATION_RULES.CATEGORY_SLUG.MIN_LENGTH} characters long`);
  }
  
  if (trimmedSlug.length > VALIDATION_RULES.CATEGORY_SLUG.MAX_LENGTH) {
    errors.push(`Slug must be no more than ${VALIDATION_RULES.CATEGORY_SLUG.MAX_LENGTH} characters long`);
  }
  
  if (!VALIDATION_RULES.CATEGORY_SLUG.PATTERN.test(trimmedSlug)) {
    errors.push(ERROR_MESSAGES.INVALID_SLUG_FORMAT);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates category name
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.CATEGORY_NAME.MIN_LENGTH) {
    errors.push(`Name must be at least ${VALIDATION_RULES.CATEGORY_NAME.MIN_LENGTH} character long`);
  }
  
  if (trimmedName.length > VALIDATION_RULES.CATEGORY_NAME.MAX_LENGTH) {
    errors.push(`Name must be no more than ${VALIDATION_RULES.CATEGORY_NAME.MAX_LENGTH} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates category order
 */
export function validateOrder(order: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof order !== 'number' || isNaN(order)) {
    errors.push('Order must be a valid number');
    return { isValid: false, errors };
  }
  
  if (order < VALIDATION_RULES.CATEGORY_ORDER.MIN) {
    errors.push(`Order must be at least ${VALIDATION_RULES.CATEGORY_ORDER.MIN}`);
  }
  
  if (order > VALIDATION_RULES.CATEGORY_ORDER.MAX) {
    errors.push(`Order must be no more than ${VALIDATION_RULES.CATEGORY_ORDER.MAX}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates translation object
 */
export function validateTranslations(translations: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!translations || typeof translations !== 'object') {
    errors.push('Translations object is required');
    return { isValid: false, errors };
  }
  
  const requiredLanguages = ['en', 'ko', 'uz'] as const;
  
  for (const lang of requiredLanguages) {
    if (!translations[lang] || typeof translations[lang] !== 'string') {
      errors.push(`Translation for ${lang} is required`);
      continue;
    }
    
    const trimmedTranslation = translations[lang].trim();
    
    if (trimmedTranslation.length < VALIDATION_RULES.TRANSLATION.MIN_LENGTH) {
      errors.push(`Translation for ${lang} must be at least ${VALIDATION_RULES.TRANSLATION.MIN_LENGTH} character long`);
    }
    
    if (trimmedTranslation.length > VALIDATION_RULES.TRANSLATION.MAX_LENGTH) {
      errors.push(`Translation for ${lang} must be no more than ${VALIDATION_RULES.TRANSLATION.MAX_LENGTH} characters long`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive validation for category creation request
 */
export function validateCategoryRequest(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Validate name
  const nameValidation = validateName((data as any).name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }
  
  // Validate slug
  const slugValidation = validateSlug((data as any).slug);
  if (!slugValidation.isValid) {
    errors.push(...slugValidation.errors);
  }
  
  // Validate order (optional)
  if ((data as any).order !== undefined) {
    const orderValidation = validateOrder((data as any).order);
    if (!orderValidation.isValid) {
      errors.push(...orderValidation.errors);
    }
  }
  
  // Validate active (optional)
  if ((data as any).active !== undefined && typeof (data as any).active !== 'boolean') {
    errors.push('Active must be a boolean value');
  }
  
  // Validate translations (if provided)
  if ((data as any).translations) {
    const translationValidation = validateTranslations((data as any).translations);
    if (!translationValidation.isValid) {
      errors.push(...translationValidation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
