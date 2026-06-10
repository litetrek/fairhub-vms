import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { mockUser, mockBoothType, mockApplication, mockInvoice } from '../__mocks__/prisma'

// Must be declared before importing the module under test
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { generateInvoice } from '@/lib/invoices'
import { createClient } from '@/lib/supabase/server'

const STAFF_USER_ID = 'staff-user-id'
const CURRENT_YEAR = new Date().getFullYear()

// Builds a fully-hydrated application with all includes that generateInvoice expects
function buildApplication(opts: {
  addOns?: Array<{ name: string; price: number; quantity: number }>
  weeksCount?: number
  boothBasePrice?: number
  boothName?: string
} = {}) {
  const { addOns = [], weeksCount = 1, boothBasePrice = 500, boothName = '10x10 Standard' } = opts
  const weeks = Array.from({ length: weeksCount }, (_, i) => ({
    id: `week-link-${i}`,
    applicationId: 'app-123',
    eventWeekId: `week-${i}`,
    eventWeek: { id: `week-${i}`, label: `Week ${i + 1}`, sortOrder: i },
  }))
  return {
    ...mockApplication({ status: 'APPROVED' }),
    vendor: mockUser(),
    boothType: mockBoothType({ name: boothName, basePrice: boothBasePrice }),
    weeks,
    assignment: { id: 'assignment-123', boothId: 'booth-123', applicationId: 'app-123', assignedById: STAFF_USER_ID, notes: null },
    addOns: addOns.map((ao, i) => ({
      id: `ao-link-${i}`,
      applicationId: 'app-123',
      eventAddOnId: `addon-${i}`,
      quantity: ao.quantity,
      eventAddOn: { id: `addon-${i}`, name: ao.name, price: ao.price },
    })),
    invoice: null,
  }
}

describe('generateInvoice', () => {
  // Captured inside the $transaction mock so each test can assert on them
  let capturedInvoiceData: Record<string, unknown> = {}
  let capturedLineItemsData: unknown[] = []

  beforeEach(() => {
    capturedInvoiceData = {}
    capturedLineItemsData = []

    // Auth: createClient returns an object whose auth.getUser resolves to a user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: STAFF_USER_ID } }, error: null }),
      },
    } as ReturnType<typeof createClient> extends Promise<infer T> ? Promise<T> : never)

    // DB: prisma.user.findUnique returns a STAFF user (satisfies role check)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      mockUser({ id: STAFF_USER_ID, role: 'STAFF' }) as any
    )

    // DB: no prior invoices this year → seq starts at 1
    vi.mocked((prisma.invoice as any).findFirst).mockResolvedValue(null)

    // DB: $transaction executes the callback with a mock tx that captures writes
    vi.mocked(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          invoice: {
            create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
              capturedInvoiceData = data
              return { id: 'new-invoice-id', ...mockInvoice(), invoiceNumber: data.invoiceNumber as string }
            }),
          },
          invoiceLineItem: {
            createMany: vi.fn().mockImplementation(async ({ data }: { data: unknown[] }) => {
              capturedLineItemsData = data
              return { count: data.length }
            }),
          },
        }
        return fn(mockTx)
      }
    )
  })

  it('generates invoice number in INV-YYYY-XXXX format with sequence 0001 when no prior invoices', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(buildApplication() as any)

    const result = await generateInvoice('app-123')

    expect(result.error).toBeUndefined()
    expect(capturedInvoiceData.invoiceNumber).toBe(`INV-${CURRENT_YEAR}-0001`)
  })

  it('increments invoice number sequence when a prior invoice exists', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(buildApplication() as any)
    // Last invoice was 0005 → next should be 0006
    vi.mocked((prisma.invoice as any).findFirst).mockResolvedValue({
      invoiceNumber: `INV-${CURRENT_YEAR}-0005`,
    })

    await generateInvoice('app-123')

    expect(capturedInvoiceData.invoiceNumber).toBe(`INV-${CURRENT_YEAR}-0006`)
  })

  it('creates a booth base price line item with correct description and amount for 1 week', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(
      buildApplication({ boothBasePrice: 500, boothName: '10x10 Standard', weeksCount: 1 }) as any
    )

    await generateInvoice('app-123')

    expect(capturedLineItemsData).toHaveLength(1)
    const boothItem = (capturedLineItemsData as Array<Record<string, unknown>>)[0]
    expect(boothItem.description).toBe('10x10 Standard — Week 1')
    expect(boothItem.quantity).toBe(1)
    expect(boothItem.unitPrice).toBe(500)
    expect(boothItem.total).toBe(500)
    expect(boothItem.sortOrder).toBe(0)
  })

  it('multiplies booth base price by week count for multi-week applications', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(
      buildApplication({ boothBasePrice: 500, weeksCount: 2 }) as any
    )

    await generateInvoice('app-123')

    const boothItem = (capturedLineItemsData as Array<Record<string, unknown>>)[0]
    expect(boothItem.quantity).toBe(2)
    expect(boothItem.unitPrice).toBe(500)
    expect(boothItem.total).toBe(1000)
    expect(boothItem.description).toBe('10x10 Standard — Week 1, Week 2')
  })

  it('adds add-on line items with correct price and quantity', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(
      buildApplication({
        weeksCount: 1,
        boothBasePrice: 500,
        addOns: [
          { name: 'Electricity', price: 100, quantity: 1 },
          { name: 'Extra Table', price: 50, quantity: 2 },
        ],
      }) as any
    )

    await generateInvoice('app-123')

    const items = capturedLineItemsData as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)

    const elec = items[1]
    expect(elec.description).toBe('Electricity')
    expect(elec.quantity).toBe(1)
    expect(elec.unitPrice).toBe(100)
    expect(elec.total).toBe(100)
    expect(elec.sortOrder).toBe(1)

    const table = items[2]
    expect(table.description).toBe('Extra Table')
    expect(table.quantity).toBe(2)
    expect(table.unitPrice).toBe(50)
    expect(table.total).toBe(100)
    expect(table.sortOrder).toBe(2)
  })

  it('calculates subtotal = sum of all line items and sets tax=0, total=subtotal', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(
      buildApplication({
        weeksCount: 2,
        boothBasePrice: 500,
        addOns: [{ name: 'Electricity', price: 100, quantity: 1 }],
      }) as any
    )

    await generateInvoice('app-123')

    // booth: 500 * 2 = 1000, electricity: 100 * 1 = 100 → subtotal = 1100
    expect(capturedInvoiceData.subtotal).toBe(1100)
    expect(capturedInvoiceData.tax).toBe(0)
    expect(capturedInvoiceData.total).toBe(1100)
  })

  it('generates invoice correctly with zero add-ons (base price only)', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(
      buildApplication({ weeksCount: 1, boothBasePrice: 750, addOns: [] }) as any
    )

    await generateInvoice('app-123')

    const items = capturedLineItemsData as Array<Record<string, unknown>>
    expect(items).toHaveLength(1)
    expect(capturedInvoiceData.subtotal).toBe(750)
    expect(capturedInvoiceData.total).toBe(750)
  })

  it('returns error if application not found', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(null)

    const result = await generateInvoice('nonexistent-app')

    expect(result.error).toBe('Application not found')
    expect(result.invoiceId).toBeUndefined()
  })

  it('returns error if application already has an invoice', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue({
      ...buildApplication(),
      invoice: mockInvoice(),
    } as any)

    const result = await generateInvoice('app-123')

    expect(result.error).toBe('Invoice already exists')
  })

  it('returns error if no booth assignment exists', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue({
      ...buildApplication(),
      assignment: null,
    } as any)

    const result = await generateInvoice('app-123')

    expect(result.error).toBe('Assign a booth first')
  })
})
