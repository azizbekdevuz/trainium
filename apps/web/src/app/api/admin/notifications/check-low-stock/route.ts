import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { requireAdminSession } from "../../../../../auth/require-admin";
import { checkLowStockProducts, checkOutOfStockProducts } from "../../../../../lib/product/product-notifications";
import { getRequestLogger } from "../../../../../lib/logging/request-logger";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!requireAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check for low stock products
    const lowStockCount = await checkLowStockProducts();
    
    // Check for out of stock products
    const outOfStockCount = await checkOutOfStockProducts();

    return NextResponse.json({ 
      success: true,
      lowStockCount,
      outOfStockCount,
      message: `Checked ${lowStockCount} low stock and ${outOfStockCount} out of stock products`
    });

  } catch (error) {
    const log = await getRequestLogger();
    log.error({ err: error, event: 'admin_check_low_stock_failed' }, 'Error checking stock levels');
    return NextResponse.json({ 
      error: "Failed to check stock levels" 
    }, { status: 500 });
  }
}