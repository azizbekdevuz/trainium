import Link from 'next/link';
import { negotiateLocale, getDictionary, type Dictionary } from '../../../../../lib/i18n';
import ToastOnQuery from '../../../../../components/ui/ToastOnQuery';
import { getProductEditData } from './data';
import { updateCore, uploadImage, updateInventory, addVariant, saveVariant, removeVariant } from './actions';
import { CoreDetailsForm } from '../../../../../components/admin/product-edit/CoreDetailsForm';
import { ImageUploadForm } from '../../../../../components/admin/product-edit/ImageUploadForm';
import { InventoryForm } from '../../../../../components/admin/product-edit/InventoryForm';
import { VariantsSection } from '../../../../../components/admin/product-edit/VariantsSection';

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const { id } = await params;
  const { product, categories } = await getProductEditData(id, dict);
  
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-gray-600">{dict.admin?.products?.notFound ?? 'Product not found.'}</p>
        <Link href={`/${lang}/admin/products`} className="text-cyan-700 hover:underline">
          {dict.common?.back ?? 'Back'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ToastOnQuery />
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {dict.admin?.products?.editTitle ?? 'Edit Product'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {dict.admin?.products?.editDescription ?? 'Update product information and settings'}
              </p>
            </div>
            <Link 
              href={`/${lang}/admin/products`} 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {dict.common?.back ?? 'Back'}
            </Link>
          </div>
        </div>

        <CoreDetailsForm 
          product={product}
          categories={categories}
          dict={dict}
          updateCore={updateCore}
        />

        <ImageUploadForm 
          productId={product.id}
          dict={dict}
          uploadImage={uploadImage}
        />

        <InventoryForm 
          productId={product.id}
          inventory={product.inventory}
          dict={dict}
          updateInventory={updateInventory}
        />

        <VariantsSection 
          product={product}
          dict={dict}
          addVariant={addVariant}
          saveVariant={saveVariant}
          removeVariant={removeVariant}
        />
      </div>
    </div>
  );
}
