// Tests for admin event management REST API routes.
// Deviations from spec:
//   - requireStaffOrAdmin returns 401 for BOTH unauthenticated and vendor callers (no 403)
//   - Staff role IS allowed on all admin routes — no admin-only guard exists in the code
//   - No separate "publish" endpoint — publishing is PATCH with { status: 'OPEN' }
//   - No ARCHIVED event guard in PATCH

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { describe, it, expect, vi } from 'vitest'
import { POST as createEvent } from '@/app/api/admin/events/route'
import { PATCH as updateEvent } from '@/app/api/admin/events/[id]/route'
import { DELETE as deleteBoothType } from '@/app/api/admin/booth-types/[btId]/route'
import { POST as createWeek } from '@/app/api/admin/events/[id]/weeks/route'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mockUser, mockEvent, mockBoothType } from '../../__mocks__/prisma'

const STAFF_USER_ID = 'staff-user-id'

function mockStaffAuth() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: STAFF_USER_ID } } }),
    },
  } as any)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(
    mockUser({ id: STAFF_USER_ID, role: 'STAFF' }) as any
  )
}

function mockUnauthenticated() {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as any)
}

function mockVendorCaller() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'vendor-user-id' } } }),
    },
  } as any)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(
    mockUser({ role: 'VENDOR' }) as any
  )
}

function makeReq(method: string, body?: Record<string, unknown>) {
  return new Request('http://localhost', {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { 'Content-Type': 'application/json' } : {},
  })
}

const VALID_EVENT = {
  name: 'Test Event',
  eventDateStart: '2026-11-01',
  eventDateEnd: '2026-11-30',
}

describe('POST /api/admin/events', () => {
  it('creates event and returns 201 for authenticated staff', async () => {
    mockStaffAuth()
    vi.mocked(prisma.event.create).mockResolvedValue(mockEvent({ name: 'Test Event' }) as any)

    const res = await createEvent(makeReq('POST', VALID_EVENT))

    expect(res.status).toBe(201)
    expect(prisma.event.create).toHaveBeenCalledOnce()
  })

  it('returns 400 when name is missing', async () => {
    mockStaffAuth()
    const { name: _n, ...rest } = VALID_EVENT

    const res = await createEvent(makeReq('POST', rest))

    expect(res.status).toBe(400)
    expect(prisma.event.create).not.toHaveBeenCalled()
  })

  it('returns 400 when eventDateStart is missing', async () => {
    mockStaffAuth()
    const { eventDateStart: _s, ...rest } = VALID_EVENT

    const res = await createEvent(makeReq('POST', rest))

    expect(res.status).toBe(400)
  })

  it('returns 401 when caller is unauthenticated', async () => {
    mockUnauthenticated()

    const res = await createEvent(makeReq('POST', VALID_EVENT))

    expect(res.status).toBe(401)
  })

  it('returns 401 when caller has VENDOR role', async () => {
    mockVendorCaller()

    const res = await createEvent(makeReq('POST', VALID_EVENT))

    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/admin/events/[id]', () => {
  const eventParams = { params: Promise.resolve({ id: 'event-123' }) }

  it('updates event fields and returns 200', async () => {
    mockStaffAuth()
    vi.mocked(prisma.event.update).mockResolvedValue(mockEvent({ name: 'Updated Name' }) as any)

    const res = await updateEvent(makeReq('PATCH', { name: 'Updated Name' }), eventParams)

    expect(res.status).toBe(200)
    expect(prisma.event.update).toHaveBeenCalledOnce()
  })

  it('publishes event when valid publicSlug is provided in body', async () => {
    mockStaffAuth()
    // event.findUnique returns undefined by default (not called for slug if body has slug)
    vi.mocked(prisma.event.update).mockResolvedValue(
      mockEvent({ status: 'OPEN', publicSlug: 'my-event' }) as any
    )

    const res = await updateEvent(
      makeReq('PATCH', { status: 'OPEN', publicSlug: 'my-event' }),
      eventParams
    )

    expect(res.status).toBe(200)
  })

  it('blocks publishing when event has no publicSlug and none in body', async () => {
    mockStaffAuth()
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ publicSlug: null } as any)

    const res = await updateEvent(makeReq('PATCH', { status: 'OPEN' }), eventParams)

    expect(res.status).toBe(400)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('blocks publishing when publicSlug in body is empty string', async () => {
    mockStaffAuth()
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ publicSlug: null } as any)

    const res = await updateEvent(
      makeReq('PATCH', { status: 'OPEN', publicSlug: '' }),
      eventParams
    )

    expect(res.status).toBe(400)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/admin/booth-types/[btId]', () => {
  const btParams = { params: Promise.resolve({ btId: 'bt-123' }) }

  it('returns 409 when applications reference this booth type', async () => {
    mockStaffAuth()
    vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'app-123' } as any)

    const res = await deleteBoothType(makeReq('DELETE'), btParams)

    expect(res.status).toBe(409)
    expect(prisma.boothType.delete).not.toHaveBeenCalled()
  })

  it('deletes booth type and returns success when no applications reference it', async () => {
    mockStaffAuth()
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.boothType.delete).mockResolvedValue(mockBoothType() as any)

    const res = await deleteBoothType(makeReq('DELETE'), btParams)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(prisma.boothType.delete).toHaveBeenCalledOnce()
  })
})

describe('POST /api/admin/events/[id]/weeks', () => {
  const eventParams = { params: Promise.resolve({ id: 'event-123' }) }
  const VALID_WEEK = { label: 'Week 1', startDate: '2026-11-01', endDate: '2026-11-07' }

  it('creates EventWeek with correct eventId and returns 201', async () => {
    mockStaffAuth()
    vi.mocked(prisma.eventWeek.create).mockResolvedValue({
      id: 'week-123',
      eventId: 'event-123',
      label: 'Week 1',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-07'),
      sortOrder: 0,
    } as any)

    const res = await createWeek(makeReq('POST', VALID_WEEK), eventParams)

    expect(res.status).toBe(201)
    expect(prisma.eventWeek.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventId: 'event-123', label: 'Week 1' }),
      })
    )
  })

  it('returns 400 when label is missing', async () => {
    mockStaffAuth()
    const { label: _l, ...rest } = VALID_WEEK

    const res = await createWeek(makeReq('POST', rest), eventParams)

    expect(res.status).toBe(400)
  })

  it('returns 400 when startDate is missing', async () => {
    mockStaffAuth()
    const { startDate: _s, ...rest } = VALID_WEEK

    const res = await createWeek(makeReq('POST', rest), eventParams)

    expect(res.status).toBe(400)
  })
})
