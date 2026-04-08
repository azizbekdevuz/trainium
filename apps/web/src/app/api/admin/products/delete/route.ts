import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { requireAdminSession } from "../../../../../auth/require-admin";
import { prisma } from "../../../../../lib/database/db";
import { getPublicBlobStorage } from "@/lib/storage/blob-storage";
import {
  keysFromProductImagesJson,
  deleteUploadKeyAndLegacyVariants,
} from "@/lib/storage/delete-public-upload";
import { getRequestLogger } from "@/lib/logging/request-logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!requireAdminSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log = await getRequestLogger();

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No product ids provided' }, { status: 400 });
    }

    // Ensure all ids are strings
    const productIds = ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product ids' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { images: true },
    });
    const keysToDelete = new Set<string>();
    for (const p of products) {
      for (const k of keysFromProductImagesJson(p.images)) {
        keysToDelete.add(k);
      }
    }

    // Delete in a transaction to maintain referential integrity
    const result = await prisma.$transaction(async (tx) => {
      // Delete dependent rows first to satisfy FKs (in correct order)
      // Note: BundleItem, Favorite, ProductLike, Review have onDelete: Cascade, so they'll be auto-deleted
      
      log.info(
        { event: 'admin_products_bulk_delete_start', count: productIds.length, productIds },
        'Deleting products'
      );

      // Delete tables WITHOUT onDelete: Cascade
      const cartItemsDeleted = await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
      log.info({ event: 'admin_products_delete_cart_items', count: cartItemsDeleted.count }, 'Deleted cart items');

      const orderItemsDeleted = await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
      log.info({ event: 'admin_products_delete_order_items', count: orderItemsDeleted.count }, 'Deleted order items');

      const variantsDeleted = await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
      log.info({ event: 'admin_products_delete_variants', count: variantsDeleted.count }, 'Deleted product variants');

      const inventoryDeleted = await tx.inventory.deleteMany({ where: { productId: { in: productIds } } });
      log.info({ event: 'admin_products_delete_inventory', count: inventoryDeleted.count }, 'Deleted inventory records');

      // Finally delete products (this will cascade delete BundleItem, Favorite, ProductLike, Review)
      const productsDeleted = await tx.product.deleteMany({ where: { id: { in: productIds } } });
      log.info({ event: 'admin_products_delete_products', count: productsDeleted.count }, 'Deleted products');
      
      return productsDeleted;
    });

    const storage = getPublicBlobStorage();
    for (const key of keysToDelete) {
      await deleteUploadKeyAndLegacyVariants(storage, key);
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    log.error({ err: error, event: 'admin_products_bulk_delete_failed' }, 'Bulk delete products failed');
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
  }
}


