import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { requireAdminSession } from "../../../../../auth/require-admin";
import { checkLowStockProducts, checkOutOfStockProducts } from "../../../../../lib/product/product-notifications";

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
    console.error('Error checking stock levels:', error);
    return NextResponse.json({ 
      error: "Failed to check stock levels" 
    }, { status: 500 });
  }
}