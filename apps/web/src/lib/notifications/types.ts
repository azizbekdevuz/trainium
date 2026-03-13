/**
 * Payload for creating notifications (used by createUserNotification, templates).
 */
export interface NotificationData {
  orderId?: string;
  orderStatus?: string;
  trackingNumber?: string;
  userEmail?: string | null;
  firstProductSlug?: string | null;
  firstProductId?: string | null;
  productId?: string;
  productName?: string;
  productSlug?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Shared notification type for bell and notifications page.
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    productId?: string;
    productName?: string;
    productSlug?: string;
    orderStatus?: string;
    status?: string;
    trackingNumber?: string;
    userEmail?: string | null;
    firstProductId?: string | null;
    firstProductSlug?: string | null;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}
