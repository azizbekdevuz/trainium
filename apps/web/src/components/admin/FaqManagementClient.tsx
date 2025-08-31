'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '../providers/I18nProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryForm } from './CategoryForm';
import { FaqForm } from './FaqForm';
import { CategoryCard } from './CategoryCard';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { 
  Plus, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface FaqTranslation {
  id?: string;
  language: string;
  question: string;
  answer: string;
}

interface Faq {
  id: string;
  categoryId: string;
  order: number;
  active: boolean;
  translations: FaqTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface FaqCategoryTranslation {
  id: string;
  language: string;
  name: string;
}

interface FaqCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  faqs: Faq[];
  translations: FaqCategoryTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    name: string;
  }[];
}

interface FaqFormData {
  categoryId: string;
  order: number;
  active: boolean;
  translations: {
    language: string;
    question: string;
    answer: string;
  }[];
}

export function FaqManagementClient() {
  const { t } = useI18n();
  
  // State management
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Category management
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    order: 0,
    active: true,
    translations: [
      { language: 'en', name: '' },
      { language: 'ko', name: '' },
      { language: 'uz', name: '' }
    ]
  });
  
  // FAQ management
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqForm, setFaqForm] = useState<FaqFormData>({
    categoryId: '',
    order: 0,
    active: true,
    translations: [
      { language: 'en', question: '', answer: '' },
      { language: 'ko', question: '', answer: '' },
      { language: 'uz', question: '', answer: '' }
    ]
  });

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'category' | 'faq';
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

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

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faq');
      if (!response.ok) throw new Error('Failed to load categories');
      
      const data = await response.json();
      setCategories(data.categories);
      // Start with all categories collapsed
      setExpandedCategories(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/faq/${editingCategory.id}` : '/api/admin/faq';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) throw new Error('Failed to save category');

      setSuccess(t('faq.admin.saved'));
      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = editingFaq ? 'PUT' : 'POST';
      const url = editingFaq ? `/api/admin/faq/items/${editingFaq.id}` : '/api/admin/faq/items';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm),
      });

      if (!response.ok) throw new Error('Failed to save FAQ');

      setSuccess(t('faq.admin.saved'));
      setShowFaqDialog(false);
      setEditingFaq(null);
      resetFaqForm();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      order: 0,
      active: true,
      translations: [
        { language: 'en', name: '' },
        { language: 'ko', name: '' },
        { language: 'uz', name: '' }
      ]
    });
  };

  const resetFaqForm = () => {
    setFaqForm({
      categoryId: '',
      order: 0,
      active: true,
      translations: [
        { language: 'en', question: '', answer: '' },
        { language: 'ko', question: '', answer: '' },
        { language: 'uz', question: '', answer: '' }
      ]
    });
  };

  const openCategoryDialog = (category?: FaqCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        order: category.order,
        active: category.active,
        translations: [
          { language: 'en', name: category.translations.find(t => t.language === 'en')?.name || '' },
          { language: 'ko', name: category.translations.find(t => t.language === 'ko')?.name || '' },
          { language: 'uz', name: category.translations.find(t => t.language === 'uz')?.name || '' }
        ]
      });
    } else {
      setEditingCategory(null);
      resetCategoryForm();
    }
    setShowCategoryDialog(true);
  };

  const openFaqDialog = (categoryId: string, faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({
        categoryId: faq.categoryId,
        order: faq.order,
        active: faq.active,
        translations: [
          { language: 'en', question: faq.translations.find(t => t.language === 'en')?.question || '', answer: faq.translations.find(t => t.language === 'en')?.answer || '' },
          { language: 'ko', question: faq.translations.find(t => t.language === 'ko')?.question || '', answer: faq.translations.find(t => t.language === 'ko')?.answer || '' },
          { language: 'uz', question: faq.translations.find(t => t.language === 'uz')?.question || '', answer: faq.translations.find(t => t.language === 'uz')?.answer || '' }
        ]
      });
    } else {
      setEditingFaq(null);
      setFaqForm({
        categoryId,
        order: 0,
        active: true,
        translations: [
          { language: 'en', question: '', answer: '' },
          { language: 'ko', question: '', answer: '' },
          { language: 'uz', question: '', answer: '' }
        ]
      });
    }
    setShowFaqDialog(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setConfirmAction({
      type: 'category',
      id: categoryId,
      name: category.name
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteFaq = (faqId: string) => {
    // Find the FAQ in categories
    let faqName = 'FAQ';
    for (const category of categories) {
      const faq = category.faqs.find(f => f.id === faqId);
      if (faq) {
        const translation = faq.translations[0];
        faqName = translation?.question || 'FAQ';
        break;
      }
    }
    
    setConfirmAction({
      type: 'faq',
      id: faqId,
      name: faqName
    });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!confirmAction) return;
    
    setDeleting(true);
    try {
      const url = confirmAction.type === 'category' 
        ? `/api/admin/faq/${confirmAction.id}`
        : `/api/admin/faq/items/${confirmAction.id}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Failed to delete ${confirmAction.type}`);

      setSuccess(`${confirmAction.type === 'category' ? 'Category' : 'FAQ'} deleted successfully`);
      await loadCategories();
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{t('common.loading', "Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('faq.admin.categories', "Categories")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('faq.manageCategoriesAndQuestions', "Manage FAQ categories and questions with multi-language support")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button 
            onClick={() => openCategoryDialog()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white transition-all duration-200 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 w-full sm:w-auto"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="truncate">{t('faq.admin.addCategory', "Add Category")}</span>
          </Button>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 dark:text-slate-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            {t('faq.admin.noCategoriesFound', "No categories found")}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t('faq.admin.getStarted', "Get started by creating your first FAQ category.")}
          </p>
          <Button 
            onClick={() => openCategoryDialog()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('faq.admin.addCategory', "Add Category")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggleExpanded={() => toggleCategoryExpanded(category.id)}
              onEditCategory={openCategoryDialog}
              onDeleteCategory={handleDeleteCategory}
              onAddFaq={openFaqDialog}
              onEditFaq={openFaqDialog}
              onDeleteFaq={handleDeleteFaq}
            />
          ))}
        </div>
      )}

      {/* Forms */}
      <CategoryForm
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        editingCategory={editingCategory}
        formData={categoryForm}
        onFormDataChange={setCategoryForm}
        onSubmit={handleCategorySubmit}
        saving={saving}
      />

      <FaqForm
        open={showFaqDialog}
        onOpenChange={setShowFaqDialog}
        editingFaq={editingFaq}
        categories={categories}
        formData={faqForm}
        onFormDataChange={setFaqForm}
        onSubmit={handleFaqSubmit}
        saving={saving}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={t('faq.admin.deleteConfirm.title')}
        description={
          confirmAction?.type === 'category' 
            ? t('faq.admin.deleteConfirm.categoryDescription', "Are you sure you want to delete this category?")
            : t('faq.admin.deleteConfirm.faqDescription', "Are you sure you want to delete this FAQ?")
        }
        itemName={confirmAction?.name}
        onConfirm={confirmDelete}
        confirmText={t('faq.admin.deleteConfirm.delete', "Delete")}
        cancelText={t('faq.admin.deleteConfirm.cancel', "Cancel")}
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
}