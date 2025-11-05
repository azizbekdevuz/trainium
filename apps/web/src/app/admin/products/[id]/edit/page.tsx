import { prisma } from '../../../../../lib/db';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import FileUpload from '../../../../../components/ui/FileUpload';
import fs from 'fs/promises';
import path from 'path';
import { negotiateLocale, getDictionary, type Dictionary } from '../../../../../lib/i18n';
import { sortCategories } from '../../../../../lib/category-utils';
import ToastOnQuery from '../../../../../components/ui/ToastOnQuery';

type Dict = Dictionary;
import { ProductEditClient } from '../../../../../components/admin/ProductEditClient';

type Params = Promise<{ id: string }>; 

function currencyMinorUnits(currency: string): number {
  switch (currency.toUpperCase()) {
    case 'KRW':
    case 'JPY':
    case 'VND':
      return 0;
    default:
      return 2;
  }
}

async function getData(id: string, dict: Dict) {
  const [product, rawCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { categories: true, variants: true, inventory: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  
  // Sort categories with translated names
  const categories = sortCategories(rawCategories, dict);
  
  return { product, categories };
}

async function updateCore(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const brand = String(formData.get('brand') ?? '').trim() || null;
  const currency = String(formData.get('currency') ?? 'KRW').trim().toUpperCase();
  // Accept price in major units (e.g., 9998 -> $9,998.00 or ₩9,998)
  const priceMajor = Number(formData.get('price') ?? '0') || 0;
  const priceCents = Math.max(0, Math.round(priceMajor * Math.pow(10, currencyMinorUnits(currency))));
  const active = String(formData.get('active') ?? '0') === '1';

  const categories = formData.getAll('categories').map((v) => String(v));

  // Basic validation to prevent accidental corrupt updates
  if (!name || !slug || !currency) {
    return;
  }

  // Ensure slug is unique (excluding current product)
  const existingWithSlug = await prisma.product.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
  if (existingWithSlug) {
    return;
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      summary,
      description,
      brand: brand || undefined,
      priceCents,
      currency,
      active,
      categories: categories.length
        ? { set: categories.map((slug) => ({ slug })) }
        : { set: [] },
    },
  });
  revalidatePath('/products');
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.saved ?? 'Changes saved');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

async function uploadImage(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id'));
  const file = formData.get('image') as File | null;
  if (!file || !file.size) return;

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const uploadsDir = path.join(process.cwd(), 'storage', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buf);
  const publicUrl = `/uploads/${filename}`;

  // Preserve existing images; set the new one as primary (first)
  const current = await prisma.product.findUnique({ where: { id }, select: { images: true } });
  const existingImages = (Array.isArray(current?.images) ? (current?.images as any[]) : []) as any[];
  const remaining = existingImages.filter((img) => img && typeof img === 'object' && img.src);
  const newImages = [{ src: publicUrl }, ...remaining];

  await prisma.product.update({ where: { id }, data: { images: newImages } });
  revalidatePath('/products');
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.imageUpdated ?? 'Image updated');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

async function updateInventory(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id'));
  const inStock = Math.max(0, Number(formData.get('inStock') ?? '0'));
  const lowStockAt = Number(formData.get('lowStockAt') ?? '') || null;

  await prisma.inventory.upsert({
    where: { productId: id },
    update: { inStock, lowStockAt: lowStockAt as number | null },
    create: { productId: id, inStock, lowStockAt: lowStockAt as number | null },
  });
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.inventorySaved ?? 'Inventory updated');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

async function addVariant(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id'));
  const name = String(formData.get('v_name') ?? '').trim();
  const sku = String(formData.get('v_sku') ?? '').trim();
  const priceCents = Math.max(0, Number(formData.get('v_priceCents') ?? '0'));
  if (!name || !sku) return;

  await prisma.productVariant.create({
    data: { productId: id, name, sku, priceCents, active: true },
  });
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.variantAdded ?? 'Variant added');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

async function saveVariant(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id')); // product id
  const variantId = String(formData.get('variantId'));
  const name = String(formData.get('name') ?? '').trim();
  const sku = String(formData.get('sku') ?? '').trim();
  const priceCents = Math.max(0, Number(formData.get('priceCents') ?? '0'));
  const active = String(formData.get('active') ?? '0') === '1';

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { name, sku, priceCents, active },
  });
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.variantSaved ?? 'Variant saved');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

async function removeVariant(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const variantId = String(formData.get('variantId'));
  const prod = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { productId: true } });
  const pid = prod?.productId ?? '';
  await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.variantDeleted ?? 'Variant deleted');
  redirect(`/${lang}/admin/products/${pid}/edit?toast=${msg}`);
}

export default async function EditProductPage({ params }: { params: Params }) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const { id } = await params;
  const { product, categories } = await getData(id, dict);
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-gray-600">{dict.admin?.products?.notFound ?? 'Product not found.'}</p>
        <Link href={`/${lang}/admin/products`} className="text-cyan-700 hover:underline">{dict.common?.back ?? 'Back'}</Link>
      </div>
    );
  }

  const selectedCategories = product.categories.map((c) => c.slug);
  const minorUnits = currencyMinorUnits(product.currency);
  const priceMajor = product.priceCents / Math.pow(10, minorUnits);

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

        {/* Core Details */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{dict.admin?.products?.core ?? 'Core Details'}</h2>
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
                defaultValue={priceMajor} 
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

        {/* Images */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{dict.admin?.products?.images ?? 'Images'}</h2>
          <form action={uploadImage} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />
            <FileUpload name="image" label={dict.admin?.products?.uploadImage ?? 'Upload image'} />
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium">
                {dict.common?.saveImage ?? 'Save Image'}
              </button>
            </div>
          </form>
        </div>

        {/* Inventory */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{dict.admin?.products?.inventory ?? 'Inventory'}</h2>
          <form action={updateInventory} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="inStock" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dict.admin?.products?.inStock ?? 'In Stock'}
                </label>
                <input 
                  id="inStock"
                  name="inStock" 
                  type="number" 
                  defaultValue={product.inventory?.inStock ?? 0} 
                  min={0} 
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lowStockAt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dict.admin?.products?.lowStockAt ?? 'Low Stock Threshold'}
                </label>
                <input 
                  id="lowStockAt"
                  name="lowStockAt" 
                  type="number" 
                  defaultValue={product.inventory?.lowStockAt ?? 0} 
                  min={0} 
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors" 
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

        {/* Variants */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{dict.admin?.products?.variants ?? 'Variants'}</h2>

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
      </div>
    </div>
  );
}


