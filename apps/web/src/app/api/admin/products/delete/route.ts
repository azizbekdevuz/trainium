import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";


export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Delete in a transaction to maintain referential integrity
    const result = await prisma.$transaction(async (tx) => {
      // Delete dependent rows first to satisfy FKs (in correct order)
      // Note: BundleItem, Favorite, ProductLike, Review have onDelete: Cascade, so they'll be auto-deleted
      
      console.log(`Deleting ${productIds.length} products:`, productIds);
      
      // Delete tables WITHOUT onDelete: Cascade
      const cartItemsDeleted = await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
      console.log(`Deleted ${cartItemsDeleted.count} cart items`);
      
      const orderItemsDeleted = await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
      console.log(`Deleted ${orderItemsDeleted.count} order items`);
      
      const variantsDeleted = await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
      console.log(`Deleted ${variantsDeleted.count} product variants`);
      
      const inventoryDeleted = await tx.inventory.deleteMany({ where: { productId: { in: productIds } } });
      console.log(`Deleted ${inventoryDeleted.count} inventory records`);
      
      // Finally delete products (this will cascade delete BundleItem, Favorite, ProductLike, Review)
      const productsDeleted = await tx.product.deleteMany({ where: { id: { in: productIds } } });
      console.log(`Deleted ${productsDeleted.count} products`);
      
      return productsDeleted;
    });

    return NextResponse.json({ success: true, count: (result as any)?.count ?? 0 });
  } catch (error) {
    console.error('Bulk delete products failed:', error);
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
  }
}


