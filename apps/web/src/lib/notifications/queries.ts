import { prisma } from '../database/db';
import { NotificationType } from '@prisma/client';

/**
 * Build where clause for user notifications
 */
export function buildNotificationWhereClause(
  userId: string,
  startDate: Date,
  options: {
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
) {
  const where: any = {
    AND: [
      {
        OR: [
          { userId }, // User-specific notifications
          { userId: null }, // System-wide notifications
        ],
      },
      {
        createdAt: {
          gte: startDate,
        },
      },
    ],
  };

  if (options.unreadOnly) {
    where.AND.push({ read: false });
  }

  if (options.type) {
    where.AND.push({ type: options.type });
  }

  return where;
}

/**
 * Get user for notification queries
 */
export async function getUserForNotifications(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
}

