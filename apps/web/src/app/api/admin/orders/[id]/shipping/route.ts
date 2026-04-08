import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { requireAdminSession } from "../../../../../../auth/require-admin";
import { prisma } from "../../../../../../lib/database/db";
import { revalidatePath } from "next/cache";
import { sendSocketOrderUpdate } from "../../../../../../lib/socket/socket-server";
import { NotificationTemplates, createUserNotification } from "../../../../../../lib/notifications";
import { getRequestLogger } from "../../../../../../lib/logging/request-logger";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!requireAdminSession(session)) {
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

  const log = await getRequestLogger();

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

        // Send real-time Socket.IO notification (best-effort; do not fail shipping update)
        const socketResult = await sendSocketOrderUpdate(
          order.userId,
          id,
          {
            orderId: id,
            status: 'SHIPPED', // Assume shipping update means order is shipped
            trackingNumber: validUpdates.trackingNo,
            message: notificationTemplate.message,
          }
        );
        if (!socketResult.ok) {
          log.warn(
            { event: 'admin_order_shipping_socket_failed', error: socketResult.error, orderId: id },
            'Socket notification failed'
          );
        }
      } catch (error) {
        log.error(
          { err: error, event: 'admin_order_shipping_notification_failed', orderId: id },
          'Failed to send shipping update notification'
        );
        // Don't fail the shipping update if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      shipping: updatedShipping
    });

  } catch (error) {
    log.error({ err: error, event: 'admin_order_shipping_patch_failed', orderId: id }, 'Error updating shipping information');
    return NextResponse.json({ error: "Failed to update shipping information" }, { status: 500 });
  }
}
