import { prisma } from '../database/db';

/**
 * Get the first product slug from an order
 */
export async function getFirstProductSlugFromOrder(orderId: string): Promise<string | null> {
  try {
    const firstOrderItem = await prisma.orderItem.findFirst({
      where: { orderId },
      orderBy: { id: 'asc' },
      select: { productId: true },
    });

    if (!firstOrderItem) return null;

    const product = await prisma.product.findUnique({
      where: { id: firstOrderItem.productId },
      select: { slug: true },
    });

    return product?.slug || null;
  } catch (error) {
    console.error('Error getting first product slug from order:', error);
    return null;
  }
}

/**
 * Get user email from user ID
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

/**
 * Calculate the start date for notification queries
 * Returns the later of: user signup date or 30 days ago
 */
export function calculateNotificationStartDate(userCreatedAt: Date): Date {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return userCreatedAt > thirtyDaysAgo ? userCreatedAt : thirtyDaysAgo;
}

