import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/database/db";
import CheckoutClient from "./CheckoutClient";

export const runtime = "nodejs";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/checkout");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      carts: {
        where: { items: { some: {} } },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { items: { include: { product: true, variant: true } } },
      },
    },
  });

  const cart = user?.carts?.[0];
  if (!cart) redirect("/cart");

  const cartDTO = {
    id: cart.id,
    items: cart.items.map((it) => ({
      id: it.id,
      name: it.product.name + (it.variant ? ` (${it.variant.name})` : ""),
      qty: it.qty,
      priceCents: it.priceCents,            // minor units in DB
      currency: it.product.currency,        // e.g. KRW
    })),
  };

  return <CheckoutClient cart={cartDTO} />;
}