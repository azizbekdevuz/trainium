import { ProductEditClient } from '../ProductEditClient';
import type { Dictionary } from '../../../lib/i18n/i18n';
import type { Product, Category } from '@prisma/client';
import { priceToMajorUnits } from '../../../lib/product/product-utils';

interface CoreDetailsFormProps {
  product: Product & { categories: Category[] };
  categories: Category[];
  dict: Dictionary;
  updateCore: (formData: FormData) => Promise<void>;
}

export function CoreDetailsForm({ product, categories, dict, updateCore }: CoreDetailsFormProps) {
  const selectedCategories = product.categories.map((c) => c.slug);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        {dict.admin?.products?.core ?? 'Core Details'}
      </h2>
      <form id="product-edit-form" action={updateCore} className="space-y-4">
        <input type="hidden" name="id" value={product.id} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.thName ?? 'Product Name'}
            </label>
            <input 
              id="name"
              name="name" 
              defaultValue={product.name} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.thSlug ?? 'URL Slug'}
            </label>
            <input 
              id="slug"
              name="slug" 
              defaultValue={product.slug} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.admin?.products?.summary ?? 'Summary'}
          </label>
          <input 
            id="summary"
            name="summary" 
            defaultValue={product.summary ?? ''} 
            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.admin?.products?.description ?? 'Description'}
          </label>
          <textarea 
            id="description"
            name="description" 
            defaultValue={product.description ?? ''} 
            className="w-full min-h-28 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors resize-vertical" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="brand" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.brand ?? 'Brand'}
            </label>
            <input 
              id="brand"
              name="brand" 
              defaultValue={product.brand ?? ''} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.thPrice ?? 'Price'}
            </label>
            <input 
              id="price"
              name="price" 
              type="number" 
              step="0.01" 
              defaultValue={priceToMajorUnits(product.priceCents, product.currency)} 
              min={0} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.currency ?? 'Currency'}
            </label>
            <select 
              id="currency"
              name="currency" 
              defaultValue={product.currency} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
            >
              <option value="USD">USD ($)</option>
              <option value="KRW">KRW (₩)</option>
              <option value="EUR">EUR (€)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {dict.admin?.products?.categories ?? 'Categories'}
          </h3>
          <ProductEditClient 
            categories={categories} 
            selectedCategories={selectedCategories} 
            dict={dict} 
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-3 pt-4">
          <input 
            type="checkbox" 
            id="active"
            name="active" 
            value="1" 
            defaultChecked={product.active} 
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800" 
          />
          <label htmlFor="active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.admin?.products?.active ?? 'Active'}
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <button 
            type="submit" 
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium"
          >
            {dict.common?.saveCore ?? 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

