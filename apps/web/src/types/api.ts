// API Request/Response Types

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  order?: number;
  active?: boolean;
  translations?: {
    en: string;
    ko: string;
    uz: string;
  };
}

export interface CreateCategoryResponse {
  category: {
    id: string;
    name: string;
    slug: string;
    order: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface GetCategoriesResponse {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    order: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

// Validation constants
export const VALIDATION_RULES = {
  CATEGORY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  CATEGORY_SLUG: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/,
  },
  CATEGORY_ORDER: {
    MIN: 0,
    MAX: 9999,
  },
  TRANSLATION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_REQUEST: 'Invalid request data',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_SLUG_FORMAT: 'Slug must contain only lowercase letters, numbers, and hyphens',
  SLUG_ALREADY_EXISTS: 'Category with this slug already exists',
  TRANSLATION_FAILED: 'Failed to update translations',
  DATABASE_ERROR: 'Database operation failed',
  INTERNAL_ERROR: 'Internal server error',
} as const;
