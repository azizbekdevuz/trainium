import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/db";
import { revalidatePath } from "next/cache";
import { sendSocketOrderUpdate } from "../../../../../../lib/socket-server";
import { NotificationTemplates, createUserNotification } from "../../../../../../lib/notifications";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await req.json();

  // Validate allowed fields
  const allowedFields = [
    'fullName', 'phone', 'address1', 'address2', 'city', 'state', 
    'postalCode', 'country', 'carrier', 'trackingNo', 'status'
  ];

  const validUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      validUpdates[key] = value;
    }
  }

  if (Object.keys(validUpdates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    // Check if order exists and has shipping
    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipping: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let updatedShipping;

    if (order.shipping) {
      // Update existing shipping record
      updatedShipping = await prisma.shipping.update({
        where: { orderId: id },
        data: validUpdates,
      });
    } else {
      // Create new shipping record with default values
      updatedShipping = await prisma.shipping.create({
        data: {
          orderId: id,
          fullName: validUpdates.fullName || '',
          phone: validUpdates.phone || '',
          address1: validUpdates.address1 || '',
          address2: validUpdates.address2 || null,
          city: validUpdates.city || '',
          state: validUpdates.state || null,
          postalCode: validUpdates.postalCode || '',
          country: validUpdates.country || 'KR',
          carrier: validUpdates.carrier || null,
          trackingNo: validUpdates.trackingNo || null,
          status: validUpdates.status || 'Preparing',
        },
      });
    }

    // Revalidate relevant pages
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    if (order.userId) {
      revalidatePath('/account');
      revalidatePath(`/account/orders/${id}`);
      revalidatePath('/account/orders');
    }
    
    // Revalidate tracking page if tracking number exists
    if (validUpdates.trackingNo) {
      revalidatePath(`/track/${validUpdates.trackingNo}`);
    }

    // Send real-time Socket.IO notification for shipping updates
    if (order.userId && (validUpdates.trackingNo || validUpdates.status)) {
      try {
        // Create proper notification template for shipping updates
        const notificationTemplate = await NotificationTemplates.ORDER_SHIPPED(
          id,
          validUpdates.trackingNo || undefined,
          order.userId
        );

        // Create database notification
        await createUserNotification(
          order.userId,
          notificationTemplate.type,
          notificationTemplate.title,
          notificationTemplate.message,
          notificationTemplate.data
        );

        // Send real-time Socket.IO notification
        sendSocketOrderUpdate(
          order.userId,
          id,
          {
            orderId: id,
            status: 'SHIPPED', // Assume shipping update means order is shipped
            trackingNumber: validUpdates.trackingNo,
            message: notificationTemplate.message,
          }
        );
      } catch (error) {
        console.error('Failed to send shipping update notification:', error);
        // Don't fail the shipping update if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      shipping: updatedShipping
    });

  } catch (error) {
    console.error('Error updating shipping information:', error);
    return NextResponse.json({ error: "Failed to update shipping information" }, { status: 500 });
  }
}
