import type { Dictionary } from '../../../lib/i18n/i18n';
import type { Inventory } from '@prisma/client';

interface InventoryFormProps {
  productId: string;
  inventory: Inventory | null;
  dict: Dictionary;
  updateInventory: (formData: FormData) => Promise<void>;
}

export function InventoryForm({ productId, inventory, dict, updateInventory }: InventoryFormProps) {
  return (
    <div className="glass-surface rounded-xl shadow-sm border border-ui-default dark:border-ui-subtle p-6 mb-6">
      <h2 className="text-xl font-semibold text-ui-primary mb-6">
        {dict.admin?.products?.inventory ?? 'Inventory'}
      </h2>
      <form action={updateInventory} className="space-y-4">
        <input type="hidden" name="id" value={productId} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="inStock" className="block text-sm font-medium text-ui-secondary">
              {dict.admin?.products?.inStock ?? 'In Stock'}
            </label>
            <input 
              id="inStock"
              name="inStock" 
              type="number" 
              defaultValue={inventory?.inStock ?? 0} 
              min={0} 
              className="w-full h-10 px-3 rounded-lg border border-ui-default dark:border-ui-subtle glass-surface text-ui-primary focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lowStockAt" className="block text-sm font-medium text-ui-secondary">
              {dict.admin?.products?.lowStockAt ?? 'Low Stock Threshold'}
            </label>
            <input 
              id="lowStockAt"
              name="lowStockAt" 
              type="number" 
              defaultValue={inventory?.lowStockAt ?? 0} 
              min={0} 
              className="w-full h-10 px-3 rounded-lg border border-ui-default dark:border-ui-subtle glass-surface text-ui-primary focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium">
            {dict.admin?.products?.saveInventory ?? 'Save Inventory'}
          </button>
        </div>
      </form>
    </div>
  );
}

