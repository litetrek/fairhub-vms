import { vi } from 'vitest'

// Auto-mock Prisma client for all unit tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    vendorProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    application: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    applicationWeek: { deleteMany: vi.fn(), createMany: vi.fn() },
    event: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    boothType: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    eventAddOn: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    eventWeek: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    boothTypeDocRequirement: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    boothAssignment: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    invoice: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoiceLineItem: { createMany: vi.fn() },
    payment: { create: vi.fn(), aggregate: vi.fn() },
    approvalLog: { create: vi.fn() },
    document: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

// Auto-mock Supabase for all unit tests
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  })),
}))

// Suppress console errors in tests
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks()
})
