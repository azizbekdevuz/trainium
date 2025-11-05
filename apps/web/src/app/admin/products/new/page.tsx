import { prisma } from '../../../../lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FileUpload from '../../../../components/ui/FileUpload';
import { sendNewProductNotification } from '../../../../lib/product-notifications';
import { negotiateLocale, getDictionary } from '../../../../lib/i18n';
import ToastOnQuery from '../../../../components/ui/ToastOnQuery';
import { sortCategories } from '../../../../lib/category-utils';
import { ProductFormClient } from '../../../../components/admin/ProductFormClient';
import fs from 'fs/promises';
import path from 'path';

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

async function createProduct(formData: FormData) {
  'use server';
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const brand = String(formData.get('brand') ?? '').trim() || null;
  const currency = String(formData.get('currency') ?? 'KRW').trim().toUpperCase();
  const priceMajor = Math.max(0, Number(formData.get('price') ?? '0'));
  const priceCents = Math.max(0, Math.round(priceMajor * Math.pow(10, currencyMinorUnits(currency))));
  const inStock = Math.max(0, Number(formData.get('inStock') ?? '0'));
  const lowStockAt = Number(formData.get('lowStockAt') ?? '0') || null;
  const active = formData.get('active') === 'on';
  const categoryIds = formData.getAll('categories') as string[];
  const imageFile = formData.get('image') as File | null;

  if (!name || !slug || !currency) return;

  let imageUrl = '';
  if (imageFile && imageFile.size > 0) {
    // Upload the file to app storage (served via /uploads/[filename])
    const buf = Buffer.from(await imageFile.arrayBuffer());
    const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
    const uploadsDir = path.join(process.cwd(), 'storage', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buf);
    imageUrl = `/uploads/${filename}`;
  }

  try {
    const product = await prisma.product.create({
      data: {
      name,
      slug,
      summary,
      description,
      brand: brand || undefined,
      priceCents,
      currency,
      images: imageUrl ? [{ src: imageUrl }] : [],
      active,
      categories: {
        connect: categoryIds.map(id => ({ id }))
      },
      inventory: { 
        create: { 
          inStock,
          lowStockAt: lowStockAt || undefined
        } 
      },
      },
    });
    await sendNewProductNotification(product.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: any) {
    // ignore notification errors
  }
  revalidatePath('/products');
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.created ?? 'Product created');
  redirect(`/${lang}/admin/products?toast=${msg}`);
}

export default async function NewProductPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const rawCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  
  // Sort categories with translated names
  const categories = sortCategories(rawCategories, dict);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <ToastOnQuery />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{dict.admin?.products?.new ?? 'New product'}</h1>
        <Link href={`/${lang}/admin/products`} className="text-sm text-cyan-700 hover:underline">{dict.common?.back ?? 'Back'}</Link>
      </div>

      <form id="product-form" action={createProduct} className="mt-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.thName ?? 'Name'}</span>
            <input name="name" className="h-11 w-full rounded-xl border px-3" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.thSlug ?? 'Slug'}</span>
            <input name="slug" className="h-11 w-full rounded-xl border px-3" required />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.summary ?? 'Summary'}</span>
          <input name="summary" className="h-11 w-full rounded-xl border px-3" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.description ?? 'Description'}</span>
          <textarea name="description" className="w-full min-h-28 rounded-xl border px-3 py-2" />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.brand ?? 'Brand'}</span>
            <input name="brand" className="h-11 w-full rounded-xl border px-3" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.thPrice ?? 'Price'}</span>
            <input name="price" type="number" step="0.01" defaultValue={0} min={0} className="h-11 w-full rounded-xl border px-3" placeholder="2200.00" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.currency ?? 'Currency'}</span>
            <select name="currency" defaultValue="USD" className="h-11 w-full rounded-xl border px-3">
              <option value="USD">USD</option>
              <option value="KRW">KRW</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.initialStock ?? 'Initial stock'}</span>
            <input name="inStock" type="number" defaultValue={0} min={0} className="h-11 w-full rounded-xl border px-3" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{dict.admin?.products?.lowStockAt ?? 'Low stock alert at'}</span>
            <input name="lowStockAt" type="number" defaultValue={0} min={0} className="h-11 w-full rounded-xl border px-3" placeholder={dict.admin?.products?.lowStockPh ?? 'Alert when stock ≤ this number'} />
          </label>
        </div>

        <ProductFormClient categories={categories} dict={dict}>
          <div></div>
        </ProductFormClient>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            name="active" 
            defaultChecked
            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <label className="text-sm font-medium text-gray-700">{dict.admin?.products?.active ?? 'Active (visible to customers)'}</label>
        </div>

        <FileUpload 
          name="image" 
          accept="image/*" 
          label={dict.admin?.products?.productImage ?? 'Product image'}
          className="w-full"
          maxSize={5}
          allowedFormats={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
          generateUniqueName={false}
          preserveOriginalName={true}
          uploadTo=""
        />

        <button className="rounded-2xl px-5 py-3 bg-cyan-600 text-white">{dict.admin?.products?.create ?? 'Create'}</button>
      </form>
    </div>
  );
}


