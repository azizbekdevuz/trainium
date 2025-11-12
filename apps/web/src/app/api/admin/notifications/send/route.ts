import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createSystemNotification } from "../../../../../lib/notifications";
import { sendSocketSystemNotification } from "../../../../../lib/socket/socket-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, title, message, data } = await req.json();

    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, message" 
      }, { status: 400 });
    }

    if (!['ORDER_UPDATE', 'PRODUCT_ALERT', 'SYSTEM_ALERT'].includes(type)) {
      return NextResponse.json({ 
        error: "Invalid notification type" 
      }, { status: 400 });
    }

    // Create database notification
    await createSystemNotification(type, title, message, data);

    // Send real-time Socket.IO notification
    sendSocketSystemNotification({
      type,
      title,
      message,
      data,
    });

    return NextResponse.json({ 
      success: true,
      message: "System notification sent successfully"
    });

  } catch (error) {
    console.error('Error sending system notification:', error);
    return NextResponse.json({ 
      error: "Failed to send system notification" 
    }, { status: 500 });
  }
}