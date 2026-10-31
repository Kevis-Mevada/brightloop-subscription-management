export type UserRole = "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "STAFF" | "CUSTOMER";

export type UserStatus = "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";

export type CustomerStatus = "ACTIVE" | "INACTIVE";

export type ProductType = "SERVICE" | "PHYSICAL" | "DIGITAL";

export type ProductStatus = "ACTIVE" | "ARCHIVED";

export type BillingInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type PlanStatus = "ACTIVE" | "ARCHIVED";

export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type SubscriptionStatus = "DRAFT" | "QUOTATION" | "CONFIRMED" | "ACTIVE" | "PAUSED" | "CLOSED";

export type InvoiceStatus = "DRAFT" | "CONFIRMED" | "PAID" | "OVERDUE" | "CANCELLED";

export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "OTHER";

export type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string | null;
  customerId: string | null;
  organizationName?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
