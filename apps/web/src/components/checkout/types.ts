export type PaymentMethod = 'stripe' | 'toss';

export type CartDTO = {
  id: string;
  items: { id: string; name: string; qty: number; priceCents: number; currency: string }[];
};

export type Address = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type TossPaymentData = {
  tossConfig?: { clientKey: string };
  amount?: number;
  orderId?: string;
  orderName?: string;
  customerName?: string;
  customerEmail?: string;
};

