import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/database/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId } = await req.json();
    
    // In a real Toss Payments integration, you would:
    // 1. Verify the payment with Toss Payments API using the paymentKey
    // 2. Check the payment status
    // 3. Update your database accordingly
    
    // For test mode, we'll simulate a successful verification
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the order by our internal orderId
    const order = await prisma.order.findFirst({
      where: { 
        paymentRef: { contains: orderId }
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // In test mode, mark as completed
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: "PAID",
        paymentRef: `toss_${paymentKey}_${orderId}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      message: "Payment completed successfully (test mode)"
    });

  } catch (error) {
    console.error('Toss payment completion error:', error);
    return NextResponse.json(
      { error: "Payment completion failed" }, 
      { status: 500 }
    );
  }
}