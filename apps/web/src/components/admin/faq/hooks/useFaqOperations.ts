import { useState } from 'react';
import type { CategoryFormData, FaqFormData, FaqCategory, Faq } from '../types';
import { getInitialCategoryForm, getInitialFaqForm, categoryToFormData, faqToFormData } from '../utils';

export function useFaqOperations(
  loadCategories: () => Promise<void>,
  setSuccess: (msg: string) => void,
  setError: (msg: string | null) => void,
  t: (key: string) => string
) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(getInitialCategoryForm());
  const [faqForm, setFaqForm] = useState<FaqFormData>(getInitialFaqForm());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'category' | 'faq';
    id: string;
    name: string;
  } | null>(null);

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
      setCategoryForm(getInitialCategoryForm());
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
      setFaqForm(getInitialFaqForm());
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const openCategoryDialog = (category?: FaqCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm(categoryToFormData(category));
    } else {
      setEditingCategory(null);
      setCategoryForm(getInitialCategoryForm());
    }
    setShowCategoryDialog(true);
  };

  const openFaqDialog = (categoryId: string, faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm(faqToFormData(faq));
    } else {
      setEditingFaq(null);
      setFaqForm(getInitialFaqForm(categoryId));
    }
    setShowFaqDialog(true);
  };

  const handleDeleteCategory = (categoryId: string, categories: FaqCategory[]) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setConfirmAction({
      type: 'category',
      id: categoryId,
      name: category.name
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteFaq = (faqId: string, categories: FaqCategory[]) => {
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

  return {
    saving,
    deleting,
    showCategoryDialog,
    setShowCategoryDialog,
    showFaqDialog,
    setShowFaqDialog,
    editingCategory,
    editingFaq,
    categoryForm,
    setCategoryForm,
    faqForm,
    setFaqForm,
    showConfirmDialog,
    setShowConfirmDialog,
    confirmAction,
    handleCategorySubmit,
    handleFaqSubmit,
    openCategoryDialog,
    openFaqDialog,
    handleDeleteCategory,
    handleDeleteFaq,
    confirmDelete,
  };
}

