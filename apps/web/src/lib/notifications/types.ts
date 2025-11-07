export interface NotificationData {
  orderId?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
  orderStatus?: string;
  trackingNumber?: string;
  userEmail?: string | null;
  firstProductId?: string | null;
  firstProductSlug?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

