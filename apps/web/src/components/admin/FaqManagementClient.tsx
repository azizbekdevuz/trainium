'use client';

import { useI18n } from '../providers/I18nProvider';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { FaqForm } from './FaqForm';
import { CategoryCard } from './CategoryCard';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { useFaqManagement } from './faq/hooks/useFaqManagement';
import { useFaqOperations } from './faq/hooks/useFaqOperations';
import { StatusMessages } from './faq/StatusMessages';
import { EmptyState } from './faq/EmptyState';
import type { FaqCategory } from './faq/types';

export function FaqManagementClient() {
  const { t } = useI18n();
  
  const {
    categories,
    loading,
    error,
    setError,
    success,
    setSuccess,
    expandedCategories,
    toggleCategoryExpanded,
    loadCategories,
  } = useFaqManagement();

  const {
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
  } = useFaqOperations(loadCategories, setSuccess, setError, t);

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
      <StatusMessages error={error} success={success} />

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
        <EmptyState onAddCategory={() => openCategoryDialog()} t={t} />
      ) : (
        <div className="space-y-4">
          {categories.map((category: FaqCategory) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggleExpanded={() => toggleCategoryExpanded(category.id)}
              onEditCategory={openCategoryDialog}
              onDeleteCategory={(id) => handleDeleteCategory(id, categories)}
              onAddFaq={openFaqDialog}
              onEditFaq={openFaqDialog}
              onDeleteFaq={(id) => handleDeleteFaq(id, categories)}
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
