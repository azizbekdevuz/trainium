import { prisma } from "./db";
import { readCartId, setCartId } from "./cookies";
import { syncCartCookie } from "../app/actions/cart";

export async function mergeCookieCartIntoUser(userId: string) {
  const cookieCartId = await readCartId();
  if (!cookieCartId) return;

  const cookieCart = await prisma.cart.findUnique({
    where: { id: cookieCartId },
    include: { items: true },
  });

  // Find or create user cart
  const userCart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!cookieCart || cookieCart.items.length === 0) {
    // If cookie cart empty, at least claim it to user and sync cookie
    if (!userCart) {
      try {
        await prisma.cart.update({ where: { id: cookieCartId }, data: { userId } });
        await setCartId(cookieCartId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error:any) {
        // Cart might not exist, create a new one for user
        const newCart = await prisma.cart.create({ data: { userId } });
        await setCartId(newCart.id);
      }
    } else {
      await setCartId(userCart.id);
    }
    return;
  }

  if (!userCart) {
    // Adopt cookie cart as user's cart
    await prisma.cart.update({ where: { id: cookieCartId }, data: { userId } });
    await setCartId(cookieCartId);
    return;
  }

  // Merge items into user's cart
  for (const it of cookieCart.items) {
    const dup = userCart.items.find(u => u.productId === it.productId && u.variantId === it.variantId);
    if (dup) {
      await prisma.cartItem.update({ where: { id: dup.id }, data: { qty: dup.qty + it.qty } });
      await prisma.cartItem.delete({ where: { id: it.id } });
    } else {
      await prisma.cartItem.update({ where: { id: it.id }, data: { cartId: userCart.id } });
    }
  }

  await syncCartCookie(userCart.id);

  // Delete the old (now empty) cookie cart and sync cookie to user's cart
  await prisma.cart.delete({ where: { id: cookieCartId } }).catch(() => {});
  await setCartId(userCart.id);
}