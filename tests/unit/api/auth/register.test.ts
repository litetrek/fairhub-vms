import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/auth/create-profile/route'
import { prisma } from '@/lib/prisma'
import { mockUser } from '../../__mocks__/prisma'

// This route handles Google OAuth profile completion, not email+password registration.
// Deviations from the spec:
//   - Duplicate user returns 200 {existing:true}, not 409
//   - Field validation returns 400, not 422

function req(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/create-profile', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID = {
  userId: 'new-user-id',
  email: 'vendor@test.com',
  businessName: 'Test Business',
  contactName: 'Test Contact',
  phone: '555-1234',
}

describe('POST /api/auth/create-profile', () => {
  it('creates user and vendor profile for valid input, returns 200', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      mockUser({ id: VALID.userId, role: 'VENDOR' }) as any
    )

    const res = await POST(req(VALID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.existing).toBeUndefined()
    expect(prisma.user.create).toHaveBeenCalledOnce()
  })

  it('newly created user always has role VENDOR', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      mockUser({ role: 'VENDOR' }) as any
    )

    await POST(req(VALID))

    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0]
    expect((createArgs.data as Record<string, unknown>).role).toBe('VENDOR')
  })

  it('returns 200 with existing:true when user already exists (not 409)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      mockUser({ id: VALID.userId }) as any
    )

    const res = await POST(req(VALID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.existing).toBe(true)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('returns 400 when userId is missing', async () => {
    const { userId: _u, ...rest } = VALID
    const res = await POST(req(rest))
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const { email: _e, ...rest } = VALID
    const res = await POST(req(rest))
    expect(res.status).toBe(400)
  })

  it('returns 400 when businessName is missing', async () => {
    const { businessName: _b, ...rest } = VALID
    const res = await POST(req(rest))
    expect(res.status).toBe(400)
  })

  it('returns 400 when contactName is missing', async () => {
    const { contactName: _c, ...rest } = VALID
    const res = await POST(req(rest))
    expect(res.status).toBe(400)
  })
})
