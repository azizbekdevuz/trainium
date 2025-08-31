'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CursorPaginationParams {
  [key: string]: string | string[] | number | undefined;
}

export interface CursorPaginationProps {
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
  baseUrl: string;
  params?: CursorPaginationParams;
  prevLabel?: string;
  nextLabel?: string;
  itemsCount?: number;
  totalLabel?: string;
  className?: string;
}

/**
 * Cursor-based pagination component for efficient pagination
 * Used for large datasets where offset pagination is inefficient
 */
export function CursorPagination({
  hasNext,
  hasPrev,
  nextCursor,
  prevCursor,
  baseUrl,
  params = {},
  prevLabel = 'Previous',
  nextLabel = 'Next',
  itemsCount,
  totalLabel = 'items shown',
  className = '',
}: CursorPaginationProps) {
  const buildUrl = (cursor?: string, direction?: 'forward' | 'back') => {
    const url = new URL(baseUrl, window.location.origin);
    const searchParams = new URLSearchParams();
    
    // Add existing params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    
    // Add cursor and direction params
    if (cursor) {
      searchParams.set('cursor', cursor);
    }
    if (direction) {
      searchParams.set('dir', direction);
    }
    
    return `${url.pathname}?${searchParams.toString()}`;
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Previous Button */}
      {hasPrev && prevCursor ? (
        <Link
          href={buildUrl(prevCursor, 'back')}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </span>
      )}

      {/* Items Count */}
      {itemsCount !== undefined && (
        <span className="text-sm text-gray-600">
          {itemsCount} {totalLabel}
        </span>
      )}

      {/* Next Button */}
      {hasNext && nextCursor ? (
        <Link
          href={buildUrl(nextCursor, 'forward')}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
