import { PrismaClient } from '@prisma/client';

/**
 * Smart automatic notification cleanup system
 * 
 * This system automatically cleans up old notifications in multiple ways:
 * 1. On-demand cleanup via API
 * 2. Background cleanup during app startup
 * 3. Lazy cleanup during notification queries
 */

const CLEANUP_THRESHOLD_DAYS = 30;
const CLEANUP_BATCH_SIZE = 1000; // Process in batches to avoid timeouts

export class NotificationCleanupService {
  private prisma: PrismaClient;
  private lastCleanup: Date | null = null;
  private cleanupInProgress = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Smart cleanup that runs automatically when needed
   */
  async smartCleanup(): Promise<{ deleted: number; skipped: boolean }> {
    // Skip if cleanup ran recently (within last 6 hours)
    if (this.lastCleanup && this.isRecentCleanup()) {
      return { deleted: 0, skipped: true };
    }

    // Skip if cleanup is already in progress
    if (this.cleanupInProgress) {
      return { deleted: 0, skipped: true };
    }

    this.cleanupInProgress = true;

    try {
      const result = await this.performCleanup();
      this.lastCleanup = new Date();
      return { deleted: result.count, skipped: false };
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Perform the actual cleanup
   */
  private async performCleanup(): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_THRESHOLD_DAYS);

    console.log(`🧹 Starting smart notification cleanup (older than ${CLEANUP_THRESHOLD_DAYS} days)...`);

    // Clean up in batches to avoid timeouts
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // First, find notifications to delete
      const notificationsToDelete = await this.prisma.notification.findMany({
        where: {
          AND: [
            { createdAt: { lt: cutoffDate } },
            { read: true }, // Only delete read notifications
            { type: { not: 'ORDER_UPDATE' } }, // Preserve order status changes
          ],
        },
        take: CLEANUP_BATCH_SIZE,
        select: { id: true },
      });

      if (notificationsToDelete.length === 0) {
        hasMore = false;
        break;
      }

      // Delete the found notifications
      const result = await this.prisma.notification.deleteMany({
        where: {
          id: { in: notificationsToDelete.map(n => n.id) },
        },
      });

      totalDeleted += result.count;
      hasMore = notificationsToDelete.length === CLEANUP_BATCH_SIZE;

      if (result.count > 0) {
        console.log(`📊 Cleaned up ${result.count} notifications (total: ${totalDeleted})`);
      }
    }

    console.log(`✅ Smart cleanup completed! Deleted ${totalDeleted} old notifications`);
    return { count: totalDeleted };
  }

  /**
   * Check if cleanup ran recently
   */
  private isRecentCleanup(): boolean {
    if (!this.lastCleanup) return false;
    
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    
    return this.lastCleanup > sixHoursAgo;
  }

  /**
   * Lazy cleanup during notification queries
   * Runs cleanup only if there are too many old notifications
   */
  async lazyCleanup(): Promise<void> {
    try {
      // Check if we have too many old notifications
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_THRESHOLD_DAYS);

      const oldNotificationCount = await this.prisma.notification.count({
        where: {
          AND: [
            { createdAt: { lt: cutoffDate } },
            { read: true },
            { type: { not: 'ORDER_UPDATE' } },
          ],
        },
      });

      // Only cleanup if we have more than 1000 old notifications
      if (oldNotificationCount > 1000) {
        console.log(`🚨 Found ${oldNotificationCount} old notifications, triggering lazy cleanup...`);
        await this.smartCleanup();
      }
    } catch (error) {
      console.error('❌ Lazy cleanup failed:', error);
      // Don't throw - this shouldn't break the main functionality
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalNotifications: number;
    oldNotifications: number;
    unreadNotifications: number;
    lastCleanup: Date | null;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_THRESHOLD_DAYS);

    const [total, old, unread] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({
        where: {
          AND: [
            { createdAt: { lt: cutoffDate } },
            { read: true },
            { type: { not: 'ORDER_UPDATE' } },
          ],
        },
      }),
      this.prisma.notification.count({
        where: { read: false },
      }),
    ]);

    return {
      totalNotifications: total,
      oldNotifications: old,
      unreadNotifications: unread,
      lastCleanup: this.lastCleanup,
    };
  }
}

// Global cleanup service instance
let cleanupService: NotificationCleanupService | null = null;

export function getCleanupService(prisma: PrismaClient): NotificationCleanupService {
  if (!cleanupService) {
    cleanupService = new NotificationCleanupService(prisma);
  }
  return cleanupService;
}
