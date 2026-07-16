import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureVendorUser } from '@/lib/auth/ensure-vendor-user'
import { prisma } from '@/lib/prisma'
import { mockUser } from '../../__mocks__/prisma'

describe('ensureVendorUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates User and VendorProfile from email signup metadata', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser({ role: 'VENDOR' }) as any)

    const result = await ensureVendorUser({
      userId: 'user-1',
      email: 'vendor@test.com',
      userMetadata: {
        businessName: 'Sunshine Crafts',
        contactName: 'Sandra Lee',
        phone: '555-0100',
        role: 'VENDOR',
      },
      emailConfirmed: true,
    })

    expect(result).toEqual({ created: true, existing: false })
    expect(prisma.user.create).toHaveBeenCalledOnce()
    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0]
    expect(createArgs.data).toMatchObject({
      id: 'user-1',
      email: 'vendor@test.com',
      phone: '555-0100',
      role: 'VENDOR',
      emailVerified: true,
    })
  })

  it('creates stub profile for OAuth users without business metadata', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser({ role: 'VENDOR' }) as any)

    await ensureVendorUser({
      userId: 'oauth-user',
      email: 'oauth@test.com',
      userMetadata: { full_name: 'Jane Vendor' },
      emailConfirmed: true,
    })

    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0]
    const profile = (createArgs.data as { vendorProfile: { create: Record<string, string> } })
      .vendorProfile.create
    expect(profile.businessName).toBe('')
    expect(profile.contactName).toBe('Jane Vendor')
  })

  it('returns existing:true without creating when user already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      mockUser({ id: 'user-1', emailVerified: false }) as any
    )
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser() as any)

    const result = await ensureVendorUser({
      userId: 'user-1',
      email: 'vendor@test.com',
      emailConfirmed: true,
    })

    expect(result).toEqual({ created: false, existing: true })
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { emailVerified: true },
    })
  })
})
