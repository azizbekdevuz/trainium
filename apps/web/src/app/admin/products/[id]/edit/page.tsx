import Link from 'next/link';
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import { negotiateLocale, getDictionary } from '../../../../../lib/i18n/i18n';
import ToastOnQuery from '../../../../../components/ui/feedback/ToastOnQuery';
import { getProductEditData } from './data';
import { updateCore, uploadImage, updateInventory, addVariant, saveVariant, removeVariant } from './actions';
import { CoreDetailsForm } from '../../../../../components/admin/product-edit/CoreDetailsForm';
import { ImageUploadForm } from '../../../../../components/admin/product-edit/ImageUploadForm';
import { InventoryForm } from '../../../../../components/admin/product-edit/InventoryForm';
import { VariantsSection } from '../../../../../components/admin/product-edit/VariantsSection';

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const { id } = await params;
  const { product, categories } = await getProductEditData(id, dict);
  
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-ui-muted">{dict.admin?.products?.notFound ?? 'Product not found.'}</p>
        <Link href={`/${lang}/admin/products`} className="text-cyan-700 hover:underline">
          {dict.common?.back ?? 'Back'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ToastOnQuery />
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ui-primary">
                {dict.admin?.products?.editTitle ?? 'Edit Product'}
              </h1>
              <p className="text-ui-muted dark:text-ui-faint mt-2">
                {dict.admin?.products?.editDescription ?? 'Update product information and settings'}
              </p>
            </div>
            <Link 
              href={`/${lang}/admin/products`} 
              className="px-4 py-2 bg-ui-inset dark:bg-ui-elevated text-ui-secondary rounded-lg text-sm font-medium hover:bg-ui-inset dark:hover:bg-ui-inset transition-colors"
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
