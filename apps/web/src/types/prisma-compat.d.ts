declare module '@prisma/client' {
  // Type-only shims for Prisma enum named exports (v6+ no longer exports these as named types)
  export type OrderStatus =
    | 'PENDING'
    | 'PAID'
    | 'FULFILLING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELED'
    | 'REFUNDED';

  export type PaymentStatus =
    | 'REQUIRES_ACTION'
    | 'PENDING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELED';

  export type PaymentProvider = 'STRIPE' | 'TOSS';

  export type DiscountType = 'PERCENT' | 'AMOUNT';

  export type ReviewStatus = 'ACTIVE' | 'DELETED';

  export type NotificationType = 'ORDER_UPDATE' | 'PRODUCT_ALERT' | 'SYSTEM_ALERT';
}
