vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/email', () => ({
  sendPaymentConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordPayment } from '@/lib/payments'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { mockUser, mockInvoice } from '../__mocks__/prisma'

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

function makeInvoice(total: number, previousPayments: { amount: number }[] = []) {
  return {
    ...mockInvoice({ total }),
    payments: previousPayments.map((p) => ({ ...p, status: 'COMPLETED' })),
  }
}

describe('recordPayment', () => {
  let capturedPaymentData: Record<string, unknown> = {}
  let capturedInvoiceStatus: string = ''

  beforeEach(() => {
    capturedPaymentData = {}
    capturedInvoiceStatus = ''
    mockStaffAuth()

    vi.mocked(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
              capturedPaymentData = data
              return { id: 'payment-id', ...data }
            }),
          },
          invoice: {
            update: vi.fn().mockImplementation(
              async ({ data }: { data: { status: string } }) => {
                capturedInvoiceStatus = data.status
                return {}
              }
            ),
          },
        }
        return fn(mockTx)
      }
    )
  })

  it('records a CHECK payment with correct invoiceId, amount, method, and recordedById', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(500) as any)

    const result = await recordPayment({
      invoiceId: 'invoice-123',
      method: 'CHECK',
      amount: 500,
      paidAt: '2026-10-15',
    })

    expect(result.error).toBeUndefined()
    expect(capturedPaymentData.invoiceId).toBe('invoice-123')
    expect(capturedPaymentData.amount).toBe(500)
    expect(capturedPaymentData.method).toBe('CHECK')
    expect(capturedPaymentData.recordedById).toBe(STAFF_USER_ID)
  })

  it('records a ZELLE payment', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(300) as any)

    const result = await recordPayment({
      invoiceId: 'invoice-123',
      method: 'ZELLE',
      amount: 300,
      paidAt: '2026-10-15',
    })

    expect(result.error).toBeUndefined()
    expect(capturedPaymentData.method).toBe('ZELLE')
  })

  it('sets invoice status to PAID when payment equals invoice total', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(500) as any)

    await recordPayment({
      invoiceId: 'invoice-123',
      method: 'CHECK',
      amount: 500,
      paidAt: '2026-10-15',
    })

    expect(capturedInvoiceStatus).toBe('PAID')
  })

  it('sets invoice status to PARTIALLY_PAID when payment is less than total', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(500) as any)

    await recordPayment({
      invoiceId: 'invoice-123',
      method: 'CHECK',
      amount: 250,
      paidAt: '2026-10-15',
    })

    expect(capturedInvoiceStatus).toBe('PARTIALLY_PAID')
  })

  it('sets status to PAID when payment exceeds invoice total (no overpayment guard)', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(500) as any)

    const result = await recordPayment({
      invoiceId: 'invoice-123',
      method: 'CHECK',
      amount: 600,
      paidAt: '2026-10-15',
    })

    expect(result.error).toBeUndefined()
    expect(capturedInvoiceStatus).toBe('PAID')
  })

  it('saves referenceNumber when provided for ZELLE payment', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(makeInvoice(200) as any)

    await recordPayment({
      invoiceId: 'invoice-123',
      method: 'ZELLE',
      amount: 200,
      paidAt: '2026-10-15',
      referenceNumber: 'ZELLE-REF-456',
    })

    expect(capturedPaymentData.referenceNumber).toBe('ZELLE-REF-456')
  })
})
