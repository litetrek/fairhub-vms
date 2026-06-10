// Reusable mock data factories for tests
// Use these to build consistent test fixtures

export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'vendor@test.com',
  phone: null,
  role: 'VENDOR' as const,
  emailVerified: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockVendorProfile = (overrides = {}) => ({
  id: 'vendor-123',
  userId: 'user-123',
  businessName: 'Test Business',
  contactName: 'Test Contact',
  businessType: 'Retail',
  address: '123 Main St',
  city: 'Ontario',
  state: 'CA',
  zip: '91761',
  website: null,
  description: null,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockEvent = (overrides = {}) => ({
  id: 'event-123',
  name: 'Nov 2026 Glowfest',
  description: 'Annual night market',
  eventDateStart: new Date('2026-11-01'),
  eventDateEnd: new Date('2026-11-30'),
  hours: '5pm - 11pm',
  location: 'Fairgrounds',
  address: '456 Fair Blvd',
  city: 'Ontario',
  state: 'CA',
  mapEmbedUrl: null,
  publicSlug: 'nov-2026-event',
  bannerImageUrl: null,
  maxVendors: 100,
  applicationDeadline: new Date('2026-10-01'),
  status: 'OPEN' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockBoothType = (overrides = {}) => ({
  id: 'boothtype-123',
  eventId: 'event-123',
  name: '10x10 Standard',
  description: 'Standard booth',
  whatsIncluded: 'Table, 2 chairs',
  basePrice: 500,
  sizeSqft: 100,
  totalCount: 20,
  sortOrder: 0,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockApplication = (overrides = {}) => ({
  id: 'app-123',
  vendorId: 'vendor-123',
  eventId: 'event-123',
  boothTypeId: 'boothtype-123',
  status: 'DRAFT' as const,
  productDescription: 'Handmade jewelry',
  productCategory: 'Crafts',
  needsElectricity: false,
  needsWater: false,
  specialRequests: null,
  rejectionNote: null,
  submittedAt: null,
  updatedAt: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockInvoice = (overrides = {}) => ({
  id: 'invoice-123',
  vendorId: 'vendor-123',
  applicationId: 'app-123',
  boothAssignmentId: 'assignment-123',
  invoiceNumber: 'INV-2026-0001',
  subtotal: 500,
  tax: 0,
  total: 500,
  status: 'DRAFT' as const,
  dueDate: new Date('2026-10-15'),
  issuedAt: new Date('2025-01-01'),
  ...overrides,
})

export const mockStaffUser = (overrides = {}) => ({
  ...mockUser({ role: 'STAFF', email: 'staff@glowfest.com' }),
  ...overrides,
})

export const mockAdminUser = (overrides = {}) => ({
  ...mockUser({ role: 'ADMIN', email: 'admin@glowfest.com' }),
  ...overrides,
})
