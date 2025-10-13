import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { markAllNotificationsAsRead } from "../../../../lib/notifications";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await markAllNotificationsAsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
