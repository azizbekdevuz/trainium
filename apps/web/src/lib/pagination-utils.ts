/**
 * Pagination utilities following DRY principles
 * Provides reusable functions for different pagination strategies
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'back';
}

export interface PaginationResult<T> {
  items: T[];
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
  totalCount?: number;
}

export interface OffsetPaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calculate pagination metadata for offset-based pagination
 */
export function calculateOffsetPagination(
  currentPage: number,
  totalCount: number,
  pageSize: number
): {
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  offset: number;
} {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  const offset = (currentPage - 1) * pageSize;

  return {
    totalPages,
    hasNext,
    hasPrev,
    offset,
  };
}

/**
 * Parse pagination options from search params
 */
export function parsePaginationOptions(searchParams: Record<string, string | string[] | undefined>): PaginationOptions {
  const page = searchParams.page ? parseInt(String(searchParams.page), 10) : 1;
  const limit = searchParams.limit ? parseInt(String(searchParams.limit), 10) : undefined;
  const cursor = searchParams.cursor ? String(searchParams.cursor) : undefined;
  const direction = searchParams.dir as 'forward' | 'back' | undefined;

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: limit && !isNaN(limit) && limit > 0 ? limit : undefined,
    cursor,
    direction,
  };
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options: PaginationOptions, maxLimit = 100): PaginationOptions {
  return {
    page: Math.max(1, options.page || 1),
    limit: options.limit ? Math.min(maxLimit, Math.max(1, options.limit)) : undefined,
    cursor: options.cursor,
    direction: options.direction || 'forward',
  };
}

/**
 * Create pagination metadata for API responses
 */
export function createPaginationMetadata(
  currentPage: number,
  totalPages: number,
  totalCount: number,
  pageSize: number
) {
  return {
    pagination: {
      currentPage,
      totalPages,
      totalCount,
      pageSize,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
}

/**
 * Default pagination constants
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;
