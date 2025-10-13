import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { markNotificationsAsRead } from "../../../../lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notificationIds } = await req.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 });
    }

    await markNotificationsAsRead(session.user.id, notificationIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
