import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { prisma } from "../../lib/db";
import AccountClient from "./AccountClient";

export const runtime = "nodejs"; // ensure Node runtime for Prisma etc.

const toHttps = (url?: string | null) =>
  url?.startsWith("http://") ? url.replace(/^http:\/\//, "https://") : url ?? null;

export default async function AccountPage() {
  const session = await auth();

  // ✅ Don’t require email; rely on the user id we attached in callbacks
  const userId = (session?.user as { id?: string } | null)?.id;
  if (!userId) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  // ✅ Fetch by ID instead of email
  const dbUser = await prisma.user.findUnique({
    where: { id: userId! },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true, shipping: true },
      },
      carts: {
        where: { items: { some: {} } },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          items: {
            include: { product: true, variant: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const data = {
    sessionUser: {
      name: dbUser?.name ?? session?.user?.name ?? null,
      // email may be null; prefer DB if present
      email: (dbUser as any)?.email ?? (session?.user as { email?: string | null })?.email ?? null,
      image: toHttps((dbUser as any)?.image ?? session?.user?.image ?? null), // ✅ normalize to https
    },
    orders: (dbUser?.orders ?? []).map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      totalCents: o.totalCents,
      currency: o.currency,
      items: o.items.map((it) => ({
        id: it.id,
        name: it.name,
        sku: it.sku,
        qty: it.qty,
        priceCents: it.priceCents,
      })),
      shipping: o.shipping
        ? {
            fullName: o.shipping.fullName,
            phone: o.shipping.phone,
            address1: o.shipping.address1,
            address2: o.shipping.address2,
            city: o.shipping.city,
            state: o.shipping.state,
            postalCode: o.shipping.postalCode,
            country: o.shipping.country,
            status: o.shipping.status,
            carrier: o.shipping.carrier,
            trackingNo: o.shipping.trackingNo,
          }
        : null,
    })),
    activeCart: dbUser?.carts?.[0]
      ? {
          id: dbUser.carts[0].id,
          items: dbUser.carts[0].items.map((it) => ({
            id: it.id,
            qty: it.qty,
            product: { id: it.productId, name: it.product.name },
            variant: it.variant ? { id: it.variantId ?? '', name: it.variant.name } : null,
            priceCents: it.priceCents,
          })),
        }
      : null,
  };

  return <AccountClient data={data} />;
}