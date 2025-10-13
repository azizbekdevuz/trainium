import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { generateMockTrackingEvents, detectCarrier } from "../../../../../lib/shipping-tracker";

export const runtime = "nodejs";

type Params = { params: Promise<{ trackingNumber: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trackingNumber } = await params;

  try {
    // Find the order with this tracking number
    const order = await prisma.order.findFirst({
      where: {
        shipping: {
          trackingNo: trackingNumber
        },
        user: {
          email: session.user.email
        }
      },
      include: {
        shipping: true,
        user: { select: { id: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Call the carrier's API (SweetTracker, AfterShip, etc.)
    // 2. Parse the response and store events in database
    // 3. Return the real tracking events

    // For now, we'll return mock data
    const carrier = detectCarrier(trackingNumber);
    const events = generateMockTrackingEvents(trackingNumber);

    return NextResponse.json({
      trackingNumber,
      carrier: carrier?.name || 'Unknown',
      carrierCode: carrier?.code,
      events,
      lastUpdated: new Date().toISOString(),
      orderId: order.id,
      orderStatus: order.status,
      shippingStatus: order.shipping?.status,
      createdAt: order.createdAt
    });

  } catch (error) {
    console.error('Error fetching tracking information:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// Public tracking endpoint (no auth required)
export async function POST(req: NextRequest, { params }: Params) {
  const { trackingNumber } = await params;
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Find the order with this tracking number and email
    const order = await prisma.order.findFirst({
      where: {
        shipping: {
          trackingNo: trackingNumber
        },
        user: {
          email: email
        }
      },
      include: {
        shipping: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Return basic tracking information
    const carrier = detectCarrier(trackingNumber);
    const events = generateMockTrackingEvents(trackingNumber);

    return NextResponse.json({
      trackingNumber,
      carrier: carrier?.name || 'Unknown',
      carrierCode: carrier?.code,
      events,
      lastUpdated: new Date().toISOString(),
      orderId: order.id,
      orderStatus: order.status,
      shippingStatus: order.shipping?.status,
      createdAt: order.createdAt
    });

  } catch (error) {
    console.error('Error fetching public tracking information:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
