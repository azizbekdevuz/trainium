import type { OrderStatus } from '@prisma/client';

export interface OrderData {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  paymentRef: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    sku: string | null;
    qty: number;
    priceCents: number;
  }>;
  shipping: {
    id: string;
    fullName: string;
    phone: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    carrier: string | null;
    trackingNo: string | null;
    status: string | null;
  } | null;
  payments: Array<{
    id: string;
    provider: string;
    providerRef: string | null;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface StatusOption {
  value: OrderStatus;
  label: string;
  color: string;
  disabled?: boolean;
}

