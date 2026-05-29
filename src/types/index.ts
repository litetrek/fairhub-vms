export type UserRole = 'VENDOR' | 'STAFF' | 'ADMIN'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONDITIONALLY_APPROVED'
  | 'APPROVED'
  | 'REJECTED'

export type DocumentType =
  | 'BUSINESS_LICENSE'
  | 'SELLERS_PERMIT'
  | 'HEALTH_PERMIT'
  | 'FOOD_HANDLER'
  | 'INSURANCE'
  | 'OTHER'

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'

export type BoothStatus = 'AVAILABLE' | 'ON_HOLD' | 'ASSIGNED'

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'

export type PaymentMethod = 'CHECK' | 'ZELLE' | 'CREDIT_CARD'

export type Channel = 'EMAIL' | 'SMS' | 'BOTH'
