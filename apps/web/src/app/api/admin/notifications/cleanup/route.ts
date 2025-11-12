import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/database/db";
import { getCleanupService } from "../../../../../lib/notification-cleanup";
import { removeDuplicateNotifications } from "../../../../../lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { removeDuplicates = false } = await request.json();
    
    const cleanupService = getCleanupService(prisma);
    const result = await cleanupService.smartCleanup();
    
    let deletedDuplicates = 0;
    if (removeDuplicates) {
      deletedDuplicates = await removeDuplicateNotifications();
    }
    
    if (result.skipped) {
      return NextResponse.json({ 
        success: true,
        deletedCount: deletedDuplicates,
        message: `Cleanup skipped - ran recently or already in progress${deletedDuplicates > 0 ? `, but removed ${deletedDuplicates} duplicates` : ''}`,
        skipped: true
      });
    }
    
    return NextResponse.json({ 
      success: true,
      deletedCount: result.deleted + deletedDuplicates,
      deletedOld: result.deleted,
      deletedDuplicates,
      message: `Smart cleanup completed! Deleted ${result.deleted} old notifications${deletedDuplicates > 0 ? ` and ${deletedDuplicates} duplicates` : ''}`,
      skipped: false
    });
  } catch (error) {
    console.error('Failed to cleanup notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup notifications' 
    }, { status: 500 });
  }
}

// GET endpoint to check cleanup stats
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cleanupService = getCleanupService(prisma);
    const stats = await cleanupService.getCleanupStats();
    
    return NextResponse.json({ 
      success: true,
      stats
    });
  } catch (error) {
    console.error('Failed to get cleanup stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get cleanup stats' 
    }, { status: 500 });
  }
}
