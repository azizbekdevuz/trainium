import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { checkLowStockProducts, checkOutOfStockProducts } from "../../../../../lib/product-notifications";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
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