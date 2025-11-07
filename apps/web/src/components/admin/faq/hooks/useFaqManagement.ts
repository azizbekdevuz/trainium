import { useState, useEffect } from 'react';
import type { FaqCategory } from '../types';

export function useFaqManagement() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faq');
      if (!response.ok) throw new Error('Failed to load categories');
      
      const data = await response.json();
      setCategories(data.categories);
      setExpandedCategories(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Auto-hide success/error messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    setCategories,
    loading,
    error,
    setError,
    success,
    setSuccess,
    expandedCategories,
    toggleCategoryExpanded,
    loadCategories,
  };
}

