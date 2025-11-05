import type { Prisma as PrismaNamespace } from '@prisma/client';

declare module '@prisma/client' {
  // Expose enum types as named exports by aliasing Prisma namespace types
  // This has no runtime impact; it only augments types for imports like
  //   import { OrderStatus, Role } from '@prisma/client'
  export type OrderStatus = PrismaNamespace.OrderStatus;
  export type Role = PrismaNamespace.Role;
  export type PaymentStatus = PrismaNamespace.PaymentStatus;
  export type PaymentProvider = PrismaNamespace.PaymentProvider;
  export type DiscountType = PrismaNamespace.DiscountType;
  export type ReviewStatus = PrismaNamespace.ReviewStatus;
  export type NotificationType = PrismaNamespace.NotificationType;
}
