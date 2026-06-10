// Vendor application logic lives in src/lib/applications.ts as server actions,
// not as REST API routes. Tests call the server actions directly.

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createDraftApplication,
  submitApplication,
  updateApplicationBoothType,
  updateApplicationWeeks,
} from '@/lib/applications'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mockVendorProfile, mockApplication } from '../../__mocks__/prisma'

const VENDOR_USER_ID = 'vendor-user-id'
const VENDOR = mockVendorProfile({ userId: VENDOR_USER_ID })

function mockVendorAuth() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: VENDOR_USER_ID } } }),
    },
  } as any)
  vi.mocked(prisma.vendorProfile.findUnique).mockResolvedValue(VENDOR as any)
}

function mockUnauthenticated() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  } as any)
}

describe('createDraftApplication', () => {
  it('creates application in DRAFT status with correct vendorId and eventId', async () => {
    mockVendorAuth()
    const newApp = mockApplication({ vendorId: VENDOR.id, eventId: 'event-123', status: 'DRAFT' })
    vi.mocked(prisma.application.create).mockResolvedValue(newApp as any)

    const result = await createDraftApplication('event-123')

    expect(result.applicationId).toBe(newApp.id)
    expect(result.error).toBeUndefined()
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: { vendorId: VENDOR.id, eventId: 'event-123', status: 'DRAFT' },
    })
  })

  it('returns error when unauthenticated', async () => {
    mockUnauthenticated()

    const result = await createDraftApplication('event-123')

    expect(result.error).toBeDefined()
    expect(prisma.application.create).not.toHaveBeenCalled()
  })
})

describe('submitApplication', () => {
  it('transitions application to SUBMITTED and sets submittedAt', async () => {
    mockVendorAuth()
    const app = mockApplication({ vendorId: VENDOR.id, status: 'DRAFT' })
    vi.mocked(prisma.application.findFirst).mockResolvedValue(app as any)
    vi.mocked(prisma.application.update).mockResolvedValue({
      ...app,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    } as any)

    const result = await submitApplication(app.id)

    expect(result.error).toBeUndefined()
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: app.id },
        data: expect.objectContaining({ status: 'SUBMITTED' }),
      })
    )
  })

  it('sets submittedAt to a Date on submission', async () => {
    mockVendorAuth()
    const app = mockApplication({ vendorId: VENDOR.id })
    vi.mocked(prisma.application.findFirst).mockResolvedValue(app as any)
    vi.mocked(prisma.application.update).mockResolvedValue(app as any)

    await submitApplication(app.id)

    const updateArgs = vi.mocked(prisma.application.update).mock.calls[0][0]
    expect((updateArgs.data as Record<string, unknown>).submittedAt).toBeInstanceOf(Date)
  })

  it('returns error when application belongs to a different vendor (no cross-vendor update)', async () => {
    mockVendorAuth()
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)

    const result = await submitApplication('other-vendors-app-id')

    expect(result.error).toBeDefined()
    expect(prisma.application.update).not.toHaveBeenCalled()
  })

  it('returns error when unauthenticated', async () => {
    mockUnauthenticated()

    const result = await submitApplication('app-123')

    expect(result.error).toBeDefined()
    expect(prisma.application.update).not.toHaveBeenCalled()
  })
})

describe('updateApplicationBoothType', () => {
  it('updates boothTypeId for vendor-owned application', async () => {
    mockVendorAuth()
    const app = mockApplication({ vendorId: VENDOR.id })
    vi.mocked(prisma.application.findFirst).mockResolvedValue(app as any)
    vi.mocked(prisma.application.update).mockResolvedValue(app as any)

    const result = await updateApplicationBoothType(app.id, 'new-booth-type-id')

    expect(result.error).toBeUndefined()
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: app.id },
      data: { boothTypeId: 'new-booth-type-id' },
    })
  })

  it('returns error when application belongs to a different vendor', async () => {
    mockVendorAuth()
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)

    const result = await updateApplicationBoothType('other-app-id', 'booth-type-id')

    expect(result.error).toBeDefined()
    expect(prisma.application.update).not.toHaveBeenCalled()
  })
})

describe('updateApplicationWeeks', () => {
  it('replaces all existing weeks with new selection', async () => {
    mockVendorAuth()
    const app = mockApplication({ vendorId: VENDOR.id })
    vi.mocked(prisma.application.findFirst).mockResolvedValue(app as any)
    vi.mocked((prisma as any).applicationWeek.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked((prisma as any).applicationWeek.createMany).mockResolvedValue({ count: 2 })

    const result = await updateApplicationWeeks(app.id, ['week-1', 'week-2'])

    expect(result.error).toBeUndefined()
    expect((prisma as any).applicationWeek.deleteMany).toHaveBeenCalledWith({
      where: { applicationId: app.id },
    })
    expect((prisma as any).applicationWeek.createMany).toHaveBeenCalledWith({
      data: [
        { applicationId: app.id, eventWeekId: 'week-1' },
        { applicationId: app.id, eventWeekId: 'week-2' },
      ],
    })
  })

  it('returns error when application belongs to a different vendor', async () => {
    mockVendorAuth()
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)

    const result = await updateApplicationWeeks('other-app-id', ['week-1'])

    expect(result.error).toBeDefined()
  })
})
