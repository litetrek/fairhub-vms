// Staff application management lives in src/lib/applications.ts as server actions,
// not as REST API routes. Tests call updateApplicationStatus directly.

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateApplicationStatus } from '@/lib/applications'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mockUser, mockApplication } from '../../__mocks__/prisma'

const STAFF_USER_ID = 'staff-user-id'

function mockStaffAuth(role: 'STAFF' | 'ADMIN' = 'STAFF') {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: STAFF_USER_ID } } }),
    },
  } as any)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(
    mockUser({ id: STAFF_USER_ID, role }) as any
  )
}

function mockUnauthenticated() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  } as any)
}

function mockVendorCaller() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'vendor-user-id' } } }),
    },
  } as any)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(
    mockUser({ id: 'vendor-user-id', role: 'VENDOR' }) as any
  )
}

describe('updateApplicationStatus', () => {
  beforeEach(() => {
    vi.mocked(prisma.application.update).mockResolvedValue(mockApplication() as any)
    vi.mocked(prisma.approvalLog.create).mockResolvedValue({} as any)
  })

  it('approves application and writes an ApprovalLog entry', async () => {
    mockStaffAuth()

    const result = await updateApplicationStatus('app-123', 'APPROVED')

    expect(result.error).toBeUndefined()
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-123' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      })
    )
    expect(prisma.approvalLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-123',
          action: 'APPROVED',
          reviewedById: STAFF_USER_ID,
        }),
      })
    )
  })

  it('rejects application and saves rejectionNote', async () => {
    mockStaffAuth()

    const result = await updateApplicationStatus('app-123', 'REJECTED', 'Does not meet requirements')

    expect(result.error).toBeUndefined()
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionNote: 'Does not meet requirements',
        }),
      })
    )
    expect(prisma.approvalLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: 'Does not meet requirements' }),
      })
    )
  })

  it('rejects without a note — rejectionNote is optional', async () => {
    mockStaffAuth()

    const result = await updateApplicationStatus('app-123', 'REJECTED')

    expect(result.error).toBeUndefined()
    // rejectionNote not spread into data when undefined
    const updateArgs = vi.mocked(prisma.application.update).mock.calls[0][0]
    expect((updateArgs.data as Record<string, unknown>).rejectionNote).toBeUndefined()
    // approvalLog.notes is null when no note provided
    expect(prisma.approvalLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: null }),
      })
    )
  })

  it('ADMIN can also approve applications', async () => {
    mockStaffAuth('ADMIN')

    const result = await updateApplicationStatus('app-123', 'APPROVED')

    expect(result.error).toBeUndefined()
    expect(prisma.application.update).toHaveBeenCalledOnce()
  })

  it('returns error when unauthenticated', async () => {
    mockUnauthenticated()

    const result = await updateApplicationStatus('app-123', 'APPROVED')

    expect(result.error).toBeDefined()
    expect(prisma.application.update).not.toHaveBeenCalled()
  })

  it('returns error when caller has VENDOR role', async () => {
    mockVendorCaller()

    const result = await updateApplicationStatus('app-123', 'APPROVED')

    expect(result.error).toBeDefined()
    expect(prisma.application.update).not.toHaveBeenCalled()
  })
})
