import { prisma } from "../database/db";
import { readCartId, setCartId } from "../utils/cookies";
import { syncCartCookie } from "../../app/actions/cart";

/**
 * Merge anonymous (cookie) cart into user cart on sign-in.
 * Enforces inventory limits: duplicate item merge clamps qty to available stock,
 * matching addToCart/updateItemQty behavior.
 */
export async function mergeCookieCartIntoUser(userId: string) {
  const cookieCartId = await readCartId();
  if (!cookieCartId) return;

  const cookieCart = await prisma.cart.findUnique({
    where: { id: cookieCartId },
    include: { items: true },
  });

  const userCart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!cookieCart || cookieCart.items.length === 0) {
    if (!userCart) {
      try {
        await prisma.cart.update({ where: { id: cookieCartId }, data: { userId } });
        await setCartId(cookieCartId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: unknown) {
        const newCart = await prisma.cart.create({ data: { userId } });
        await setCartId(newCart.id);
      }
    } else {
      await setCartId(userCart.id);
    }
    return;
  }

  if (!userCart) {
    await prisma.cart.update({ where: { id: cookieCartId }, data: { userId } });
    await setCartId(cookieCartId);
    return;
  }

  // Merge items with stock enforcement (same invariants as addToCart/updateItemQty)
  await prisma.$transaction(async (tx) => {
    for (const it of cookieCart!.items) {
      const currentUserItems = await tx.cartItem.findMany({
        where: { cartId: userCart!.id },
        select: { id: true, productId: true, variantId: true, qty: true },
      });
      const dup = currentUserItems.find((u) => u.productId === it.productId && u.variantId === it.variantId);
      if (dup) {
        const inv = await tx.inventory.findUnique({ where: { productId: it.productId } });
        const available = inv?.inStock ?? 0;
        const mergedQty = dup.qty + it.qty;
        const finalQty = Math.min(mergedQty, available);
        await tx.cartItem.delete({ where: { id: it.id } });
        if (finalQty <= 0) {
          await tx.cartItem.delete({ where: { id: dup.id } });
        } else {
          await tx.cartItem.update({ where: { id: dup.id }, data: { qty: finalQty } });
        }
      } else {
        // Move item to user cart; clamp qty to available stock (same invariant as addToCart)
        const inv = await tx.inventory.findUnique({ where: { productId: it.productId } });
        const available = inv?.inStock ?? 0;
        const finalQty = Math.min(it.qty, available);
        if (finalQty <= 0) {
          await tx.cartItem.delete({ where: { id: it.id } });
        } else {
          await tx.cartItem.update({
            where: { id: it.id },
            data: { cartId: userCart!.id, qty: finalQty },
          });
        }
      }
    }
  });

  await syncCartCookie(userCart.id);

  await prisma.cart.delete({ where: { id: cookieCartId } }).catch(() => {});
  await setCartId(userCart.id);
}