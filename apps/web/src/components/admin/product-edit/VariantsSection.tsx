import type { Dictionary } from '../../../lib/i18n';
import type { ProductVariant, Product } from '@prisma/client';

interface VariantsSectionProps {
  product: Product & { variants: ProductVariant[] };
  dict: Dictionary;
  addVariant: (formData: FormData) => Promise<void>;
  saveVariant: (formData: FormData) => Promise<void>;
  removeVariant: (formData: FormData) => Promise<void>;
}

export function VariantsSection({ product, dict, addVariant, saveVariant, removeVariant }: VariantsSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        {dict.admin?.products?.variants ?? 'Variants'}
      </h2>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {dict.admin?.products?.thName ?? 'Name'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {dict.admin?.products?.thSku ?? 'SKU'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {(dict.admin?.products?.priceCentsWithCurrency ?? 'Price ({{currency}} cents)').replace('{{currency}}', product.currency)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {dict.admin?.products?.thActive ?? 'Active'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {product.variants.map(v => {
              const formId = `v-${v.id}`;
              return (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <input form={formId} type="hidden" name="id" value={product.id} />
                    <input form={formId} type="hidden" name="variantId" value={v.id} />
                    <input 
                      form={formId} 
                      name="name" 
                      defaultValue={v.name} 
                      className="h-9 w-48 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      form={formId} 
                      name="sku" 
                      defaultValue={v.sku} 
                      className="h-9 w-40 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      form={formId} 
                      name="priceCents" 
                      type="number" 
                      defaultValue={v.priceCents} 
                      className="h-9 w-32 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      form={formId} 
                      type="checkbox" 
                      name="active" 
                      value="1" 
                      defaultChecked={v.active} 
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-800" 
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form id={formId} action={saveVariant} />
                      <button 
                        form={formId} 
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {dict.common?.save ?? 'Save'}
                      </button>
                      <form action={removeVariant}>
                        <input type="hidden" name="variantId" value={v.id} />
                        <button className="px-3 py-1 text-red-600 hover:text-red-700 text-xs font-medium transition-colors">
                          {dict.common?.delete ?? 'Delete'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form action={addVariant} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={product.id} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="v_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.variantName ?? 'Variant Name'}
            </label>
            <input 
              id="v_name"
              name="v_name" 
              placeholder={dict.admin?.products?.variantNamePh ?? 'e.g. Single'} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="v_sku" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.admin?.products?.thSku ?? 'SKU'}
            </label>
            <input 
              id="v_sku"
              name="v_sku" 
              placeholder="SKU-001" 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="v_priceCents" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {(dict.admin?.products?.priceCentsWithCurrency ?? 'Price ({{currency}} cents)').replace('{{currency}}', product.currency)}
            </label>
            <input 
              id="v_priceCents"
              name="v_priceCents" 
              type="number" 
              defaultValue={0} 
              min={0} 
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
              required
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium">
            {dict.admin?.products?.addVariant ?? 'Add Variant'}
          </button>
        </div>
      </form>
    </div>
  );
}

