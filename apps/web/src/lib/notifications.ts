import { prisma } from './db';
import { NotificationType } from '@prisma/client';
import { getCleanupService } from './notification-cleanup';
import { PAGINATION_DEFAULTS, type OffsetPaginationResult } from './pagination-utils';
import { calculateNotificationStartDate } from './notifications/helpers';
import { buildNotificationWhereClause, getUserForNotifications } from './notifications/queries';
import type { NotificationData } from './notifications/types';

// Re-export types and templates for backward compatibility
export type { NotificationData } from './notifications/types';
export { NotificationTemplates } from './notifications/templates';

/**
 * Create a notification for a specific user
 */
export async function createUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}

/**
 * Create a system-wide notification (for all users)
 */
export async function createSystemNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  return await prisma.notification.create({
    data: {
      userId: null, // null = system-wide
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotificationsPaginated(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
): Promise<OffsetPaginationResult<any>> {
  const {
    page = 1,
    limit = PAGINATION_DEFAULTS.PAGE_SIZE,
    unreadOnly = false,
    type,
  } = options;

  // Trigger lazy cleanup (runs automatically if needed)
  const cleanupService = getCleanupService(prisma);
  cleanupService.lazyCleanup().catch(console.error); // Don't wait for it

  const user = await getUserForNotifications(userId);

  if (!user) {
    return {
      items: [],
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  const startDate = calculateNotificationStartDate(user.createdAt);
  const where = buildNotificationWhereClause(userId, startDate, { unreadOnly, type });

  // Get total count for pagination
  const totalCount = await prisma.notification.count({ where });

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Get paginated results
  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return {
    items,
    currentPage: page,
    totalPages,
    totalCount,
    hasNext,
    hasPrev,
  };
}

/**
 * Get notifications for a user (legacy function for backward compatibility)
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
) {
  const result = await getUserNotificationsPaginated(userId, options);
  return result.items;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
  const user = await getUserForNotifications(userId);

  if (!user) {
    return { count: 0 };
  }

  const startDate = calculateNotificationStartDate(user.createdAt);

  return await prisma.notification.updateMany({
    where: {
      AND: [
        { id: { in: notificationIds } },
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate,
          },
        },
      ],
    },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const user = await getUserForNotifications(userId);

  if (!user) {
    return { count: 0 };
  }

  const startDate = calculateNotificationStartDate(user.createdAt);

  return await prisma.notification.updateMany({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate,
          },
        },
        { read: false },
      ],
    },
    data: { read: true },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  const user = await getUserForNotifications(userId);

  if (!user) {
    return 0;
  }

  const startDate = calculateNotificationStartDate(user.createdAt);

  return await prisma.notification.count({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate,
          },
        },
        { read: false },
      ],
    },
  });
}

/**
 * Delete old notifications (cleanup)
 * Preserves ORDER_UPDATE notifications (status changes) as they are important for order history
 */
export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await prisma.notification.deleteMany({
    where: {
      AND: [
        { createdAt: { lt: cutoffDate } },
        { read: true }, // Only delete read notifications
        { type: { not: 'ORDER_UPDATE' } }, // Preserve order status changes
      ],
    },
  });
}

/**
 * Remove duplicate notifications from database
 * This function identifies and removes duplicate notifications based on:
 * - Same type, title, and timestamp (within 5 seconds)
 * - For PRODUCT_ALERT, also considers productId
 * - Keeps the database version (preferring the one with more complete data)
 */
export async function removeDuplicateNotifications() {
  console.log('🔍 Starting duplicate notification cleanup...');

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const duplicatesToDelete: string[] = [];
    const processed = new Set<string>();

    for (const notification of notifications) {
      let key = `${notification.type}-${notification.title}-${Math.floor(notification.createdAt.getTime() / 5000)}`;

      if (notification.type === 'PRODUCT_ALERT' && notification.data && typeof notification.data === 'object') {
        const data = notification.data as any;
        if (data.productId) {
          key += `-${data.productId}`;
        }
      }

      if (processed.has(key)) {
        duplicatesToDelete.push(notification.id);
        console.log(`🗑️ Marking duplicate for deletion: ${notification.id} (${notification.type})`);
      } else {
        processed.add(key);
      }
    }

    if (duplicatesToDelete.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: duplicatesToDelete },
        },
      });

      console.log(`✅ Removed ${result.count} duplicate notifications`);
      return result.count;
    } else {
      console.log('✅ No duplicate notifications found');
      return 0;
    }
  } catch (error) {
    console.error('❌ Failed to remove duplicate notifications:', error);
    throw error;
  }
}
