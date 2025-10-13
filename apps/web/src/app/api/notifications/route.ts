import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getUserNotifications, getUnreadNotificationCount } from "../../../lib/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const type = searchParams.get('type') as any;

  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, { limit, unreadOnly, type }),
      getUnreadNotificationCount(session.user.id),
    ]);

    // Parse the JSON data field for each notification and convert dates to strings
    const parsedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data as string) : null,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: parsedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
