import { prisma } from './db';
import { readCartId, setCartId } from './cookies';
import { revalidatePath } from 'next/cache';
import { auth } from '../auth';

export type CartWithItems = Awaited<ReturnType<typeof getCart>>;

export async function ensureCart(): Promise<string> {
  const session = await auth();
  let cookieId = await readCartId();

  if (session?.user?.id) {
    // If user is logged in:
    if (cookieId) {
      // Claim/ensure cookie cart exists and belongs to the user
      await prisma.cart.upsert({
        where: { id: cookieId },
        update: { userId: session.user.id },
        create: { id: cookieId, userId: session.user.id },
      });
      return cookieId;
    }

    // No cookie: try to use existing user cart
    const existing = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    // Create a fresh cart for the user
    const newId = crypto.randomUUID();
    await prisma.cart.create({ data: { id: newId, userId: session.user.id } });
    return newId;
  }

  // Guest: ensure there is a cookie cart and a DB row for it
  if (!cookieId) {
    cookieId = crypto.randomUUID();
  }
  await prisma.cart.upsert({
    where: { id: cookieId },
    update: {},
    create: { id: cookieId },
  });
  return cookieId;
}

export async function getCart() {
  const session = await auth();
  const cookieId = await readCartId();

  // If logged in, prefer user's latest cart; keep cookie synced to it
  if (session?.user?.id) {
    const userCart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: true, variant: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return userCart;
  }

  if (!cookieId) return null;

  return prisma.cart.findUnique({
    where: { id: cookieId },
    include: {
      items: { include: { product: true, variant: true }, orderBy: { createdAt: 'asc' } },
    },
  });
}

export async function addToCart(productId: string, variantId: string | '', qty = 1) {
  const id = await ensureCart();

  await setCartId(id);

  // Enforce inventory limit
  const inv = await prisma.inventory.findUnique({ where: { productId } });
  const available = inv?.inStock ?? 0;

  const candidates = await prisma.cartItem.findMany({
    where: { cartId: id, productId },
    select: { id: true, qty: true, variantId: true },
  });
  const existing = candidates.find((it) => (variantId ? it.variantId === variantId : it.variantId === null));

  if (existing) {
    const desired = existing.qty + qty;
    if (desired > available) {
      throw new Error(`STOCK_EXCEEDED:${available}`);
    }
    await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: desired } });
  } else {
    const variant = variantId ? await prisma.productVariant.findUnique({ where: { id: variantId } }) : null;
    const product = !variant ? await prisma.product.findUnique({ where: { id: productId } }) : null;

    if (qty > available) {
      throw new Error(`STOCK_EXCEEDED:${available}`);
    }
    if (variant) {
      await prisma.cartItem.create({
        data: {
          cartId: id,
          productId,
          variantId: variant.id,
          qty,
          priceCents: variant.priceCents,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: ({
          cartId: id,
          productId,
          qty,
          priceCents: product?.priceCents ?? 0,
        }) as any,
      });
    }
  }

  revalidatePath('/cart');
  revalidatePath('/products?q=&category=&inStock=1&min=0&max=50000000&sort=new');
}

export async function updateItemQty(itemId: string, qty: number) {
  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    // Enforce available inventory
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true } });
    if (item) {
      const inv = await prisma.inventory.findUnique({ where: { productId: item.productId } });
      const available = inv?.inStock ?? 0;
      if (qty > available) {
        throw new Error(`STOCK_EXCEEDED:${available}`);
      }
      await prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    }
  }
  revalidatePath('/cart');
}

export async function removeItem(itemId: string) {
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath('/cart');
}

export function cartTotals(cart: NonNullable<CartWithItems>) {
  const subtotal = cart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
  const shipping = 0;
  const discount = 0;
  const total = subtotal + shipping - discount;
  return { subtotal, shipping, discount, total };
}