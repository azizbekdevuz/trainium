'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationParams {
  [key: string]: string | string[] | number | undefined;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  params?: PaginationParams;
  prevLabel?: string;
  nextLabel?: string;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Reusable pagination component following DRY principles
 * Supports both cursor-based and offset-based pagination
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  params = {},
  prevLabel = 'Previous',
  nextLabel = 'Next',
  showPageNumbers = false,
  maxVisiblePages = 5,
  className = '',
}: PaginationProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const buildUrl = (page: number) => {
    // Use relative URL construction to avoid window dependency during SSR
    const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
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
    
    // Add page param
    if (page > 1) {
      searchParams.set('page', String(page));
    }
    
    return `${url.pathname}?${searchParams.toString()}`;
  };

  const getVisiblePages = () => {
    if (!showPageNumbers || totalPages <= 1) return [];
    
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {/* Previous Button */}
      {hasPrev ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </span>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <>
          {getVisiblePages().map((page) => (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {page}
            </Link>
          ))}
        </>
      )}

      {/* Next Button */}
      {hasNext ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
