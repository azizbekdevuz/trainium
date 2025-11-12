import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/database/db";
import { ORDER_STATUS } from "../../../../../../lib/order/order-status";
import { revalidatePath } from "next/cache";
import { createUserNotification, NotificationTemplates } from "../../../../../../lib/notifications";
import { sendSocketOrderUpdate } from "../../../../../../lib/socket/socket-server";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status || !Object.values(ORDER_STATUS).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, email: true, name: true } },
        shipping: true,
      },
    });

    // Revalidate relevant pages
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    if (updatedOrder.user) {
      revalidatePath('/account');
      revalidatePath(`/account/orders/${id}`);
      revalidatePath('/account/orders');
    }
    
    // Revalidate tracking page if tracking number exists
    if (updatedOrder.shipping?.trackingNo) {
      revalidatePath(`/track/${updatedOrder.shipping.trackingNo}`);
    }

    // Send notification to customer about status change
    if (updatedOrder.user?.id) {
      try {
        let notificationTemplate;
        
        switch (status) {
          case 'SHIPPED':
            notificationTemplate = await NotificationTemplates.ORDER_SHIPPED(
              updatedOrder.id, 
              updatedOrder.shipping?.trackingNo || undefined,
              updatedOrder.user.id
            );
            break;
          case 'DELIVERED':
            notificationTemplate = await NotificationTemplates.ORDER_DELIVERED(
              updatedOrder.id,
              updatedOrder.user.id
            );
            break;
          default:
            notificationTemplate = await NotificationTemplates.ORDER_STATUS_UPDATE(
              updatedOrder.id, 
              status,
              updatedOrder.user.id
            );
        }

        // Create database notification
        await createUserNotification(
          updatedOrder.user.id,
          notificationTemplate.type,
          notificationTemplate.title,
          notificationTemplate.message,
          notificationTemplate.data
        );

        // Send real-time Socket.IO notification
        const _tracking: string | null | undefined = updatedOrder.shipping?.trackingNo;
        const trackingNumber: string | undefined = _tracking === null ? undefined : _tracking;

        sendSocketOrderUpdate(
          updatedOrder.user.id,
          updatedOrder.id,
          {
            orderId: updatedOrder.id,
            status,
            trackingNumber,
            message: notificationTemplate.message,
          }
        );
      } catch (error) {
        console.error('Failed to send notification:', error);
        // Don't fail the order update if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
