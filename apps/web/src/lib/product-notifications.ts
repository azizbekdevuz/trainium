import { prisma } from './db';
import { sendSocketProductAlertToAll, sendSocketProductAlert } from './socket-server';
import { createSystemNotification, NotificationTemplates } from './notifications';

/**
 * Product notification utilities for real-time alerts
 */

export interface ProductAlertData {
  productId: string;
  productName: string;
  alertType: 'LOW_STOCK' | 'NEW_PRODUCT' | 'PRICE_CHANGE' | 'OUT_OF_STOCK';
  message: string;
  currentStock?: number;
  lowStockAt?: number;
  newPrice?: number;
  oldPrice?: number;
}

/**
 * Check for low stock products and send alerts
 */
export async function checkLowStockProducts() {
  try {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        inventory: {
          AND: [
            {
              inStock: {
                lte: prisma.inventory.fields.lowStockAt,
              },
            },
            {
              inStock: {
                gt: 0, // Not out of stock
              },
            },
          ],
        },
      },
      include: {
        inventory: true,
      },
    });

    for (const product of lowStockProducts) {
      if (product.inventory) {
        const alertData: ProductAlertData = {
          productId: product.id,
          productName: product.name,
          alertType: 'LOW_STOCK',
          message: `i18n.product.lowStock|${product.name}|${product.inventory.inStock}`,
          currentStock: product.inventory.inStock,
          lowStockAt: product.inventory.lowStockAt || undefined,
        };

        // Send to all users (real-time) and persist a system-wide DB notification
        sendSocketProductAlertToAll(product.id, alertData);
        const templ = NotificationTemplates.LOW_STOCK_ALERT(product.name, product.slug);
        await createSystemNotification(templ.type, templ.title, templ.message, templ.data);
      }
    }

    return lowStockProducts.length;
  } catch (error) {
    console.error('Error checking low stock products:', error);
    return 0;
  }
}

/**
 * Check for out of stock products and send alerts
 */
export async function checkOutOfStockProducts() {
  try {
    const outOfStockProducts = await prisma.product.findMany({
      where: {
        inventory: {
          inStock: 0,
        },
      },
      include: {
        inventory: true,
      },
    });

    for (const product of outOfStockProducts) {
      const alertData: ProductAlertData = {
        productId: product.id,
        productName: product.name,
        alertType: 'OUT_OF_STOCK',
        message: `i18n.product.outOfStock|${product.name}`,
        currentStock: 0,
      };

      // Send to all users (real-time) and persist
      sendSocketProductAlertToAll(product.id, alertData);
      const templ = NotificationTemplates.LOW_STOCK_ALERT(product.name, product.slug);
      await createSystemNotification(templ.type, templ.title, templ.message, templ.data);
    }

    return outOfStockProducts.length;
  } catch (error) {
    console.error('Error checking out of stock products:', error);
    return 0;
  }
}

/**
 * Check a single product for low stock and notify all users if threshold crossed
 */
export async function checkAndNotifyLowStockForProduct(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product || !product.inventory) return false;

    const { inStock, lowStockAt } = product.inventory;
    if (lowStockAt == null) return false;
    if (inStock <= lowStockAt && inStock > 0) {
      const alertData: ProductAlertData = {
        productId: product.id,
        productName: product.name,
        alertType: 'LOW_STOCK',
      message: `i18n.product.lowStock|${product.name}|${inStock}`,
        currentStock: inStock,
        lowStockAt,
      };

      // Real-time broadcast + persist as a system notification
      sendSocketProductAlertToAll(product.id, alertData);
      const templ = NotificationTemplates.LOW_STOCK_ALERT(product.name, product.slug);
      await createSystemNotification(templ.type, templ.title, templ.message, templ.data);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking low stock for product:', productId, error);
    return false;
  }
}

/**
 * Send new product notification
 */
export async function sendNewProductNotification(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
        variants: {
          take: 1,
          orderBy: { priceCents: 'asc' },
        },
      },
    });

    if (!product) return;

    const alertData: ProductAlertData = {
      productId: product.id,
      productName: product.name,
      alertType: 'NEW_PRODUCT',
      message: `i18n.product.newProduct|${product.name}`,
    };

    // Send to all users (real-time) and persist
    sendSocketProductAlertToAll(product.id, alertData);
    const templ = NotificationTemplates.NEW_PRODUCT(product.name, product.slug);
    await createSystemNotification(templ.type, templ.title, templ.message, templ.data);
  } catch (error) {
    console.error('Error sending new product notification:', error);
  }
}

/**
 * Send price change notification to users who have this product in their cart
 */
export async function sendPriceChangeNotification(
  productId: string, 
  oldPrice: number, 
  newPrice: number
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return;

    // Find users who have this product in their cart
    const cartItems = await prisma.cartItem.findMany({
      where: {
        variant: {
          productId: productId,
        },
      },
      include: {
        cart: {
          include: {
            user: true,
          },
        },
      },
    });

    const alertData: ProductAlertData = {
      productId: product.id,
      productName: product.name,
      alertType: 'PRICE_CHANGE',
      message: `i18n.product.priceChange|${product.name}|${(oldPrice / 100).toFixed(2)}|${(newPrice / 100).toFixed(2)}`,
      oldPrice,
      newPrice,
    };

    // Send to users who have this product in their cart
    for (const cartItem of cartItems) {
      if (cartItem.cart.userId) {
        sendSocketProductAlert(cartItem.cart.userId, productId, alertData);
      }
    }
  } catch (error) {
    console.error('Error sending price change notification:', error);
  }
}

/**
 * Send low stock alert to users who have this product in their cart
 */
export async function sendLowStockAlertToCartUsers(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
      },
    });

    if (!product || !product.inventory) return;

    // Find users who have this product in their cart
    const cartItems = await prisma.cartItem.findMany({
      where: {
        variant: {
          productId: productId,
        },
      },
      include: {
        cart: {
          include: {
            user: true,
          },
        },
      },
    });

    const alertData: ProductAlertData = {
      productId: product.id,
      productName: product.name,
      alertType: 'LOW_STOCK',
      message: `${product.name} is running low on stock (${product.inventory.inStock} left). Order soon to avoid missing out!`,
      currentStock: product.inventory.inStock,
      lowStockAt: product.inventory.lowStockAt || undefined,
    };

    // Send to users who have this product in their cart
    for (const cartItem of cartItems) {
      if (cartItem.cart.userId) {
        sendSocketProductAlert(cartItem.cart.userId, productId, alertData);
      }
    }
  } catch (error) {
    console.error('Error sending low stock alert to cart users:', error);
  }
}