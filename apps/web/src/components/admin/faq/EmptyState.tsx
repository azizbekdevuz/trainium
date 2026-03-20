import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

interface EmptyStateProps {
  onAddCategory: () => void;
  t: (path: string, fallback?: string) => string;
}

export function EmptyState({ onAddCategory, t }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-ui-faint dark:text-ui-faint mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-ui-primary mb-2">
        {t('faq.admin.noCategoriesFound', 'No categories found')}
      </h3>
      <p className="text-sm text-ui-muted dark:text-ui-faint mb-4">
        {t('faq.admin.getStarted', 'Get started by creating your first FAQ category.')}
      </p>
      <Button 
        onClick={onAddCategory}
        className="bg-cyan-500 hover:bg-cyan-600 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('faq.admin.addCategory', 'Add Category')}
      </Button>
    </div>
  );
}

