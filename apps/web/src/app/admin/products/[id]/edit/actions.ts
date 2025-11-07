'use server';

import { prisma } from '../../../../../lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { negotiateLocale, getDictionary } from '../../../../../lib/i18n';
import { currencyMinorUnits, priceToMinorUnits } from '../../../../../lib/product-utils';
import fs from 'fs/promises';
import path from 'path';

/**
 * Update core product information
 */
export async function updateCore(formData: FormData) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const id = String(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const brand = String(formData.get('brand') ?? '').trim() || null;
  const currency = String(formData.get('currency') ?? 'KRW').trim().toUpperCase();
  const priceMajor = Number(formData.get('price') ?? '0') || 0;
  const priceCents = priceToMinorUnits(priceMajor, currency);
  const active = String(formData.get('active') ?? '0') === '1';
  const categories = formData.getAll('categories').map((v) => String(v));

  // Basic validation
  if (!name || !slug || !currency) {
    return;
  }

  // Ensure slug is unique (excluding current product)
  const existingWithSlug = await prisma.product.findFirst({ 
    where: { slug, NOT: { id } }, 
    select: { id: true } 
  });
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

/**
 * Upload and update product image
 */
export async function uploadImage(formData: FormData) {
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
  const current = await prisma.product.findUnique({ 
    where: { id }, 
    select: { images: true } 
  });
  const existingImages = (Array.isArray(current?.images) ? (current?.images as any[]) : []) as any[];
  const remaining = existingImages.filter((img) => img && typeof img === 'object' && img.src);
  const newImages = [{ src: publicUrl }, ...remaining];

  await prisma.product.update({ 
    where: { id }, 
    data: { images: newImages } 
  });
  
  revalidatePath('/products');
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.imageUpdated ?? 'Image updated');
  redirect(`/${lang}/admin/products/${id}/edit?toast=${msg}`);
}

/**
 * Update product inventory
 */
export async function updateInventory(formData: FormData) {
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

/**
 * Add a new product variant
 */
export async function addVariant(formData: FormData) {
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

/**
 * Save/update a product variant
 */
export async function saveVariant(formData: FormData) {
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

/**
 * Remove a product variant
 */
export async function removeVariant(formData: FormData) {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  const variantId = String(formData.get('variantId'));
  const prod = await prisma.productVariant.findUnique({ 
    where: { id: variantId }, 
    select: { productId: true } 
  });
  const pid = prod?.productId ?? '';
  
  await prisma.productVariant.delete({ where: { id: variantId } });
  
  revalidatePath('/admin/products');
  const msg = encodeURIComponent(dict.admin?.products?.toast?.variantDeleted ?? 'Variant deleted');
  redirect(`/${lang}/admin/products/${pid}/edit?toast=${msg}`);
}

