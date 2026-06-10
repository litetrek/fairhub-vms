'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmail } from '@/lib/email'

async function getStaffUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!staffUser || (staffUser.role !== 'STAFF' && staffUser.role !== 'ADMIN')) {
    throw new Error('Not authorized')
  }
  return staffUser
}

export async function assignBooth(
  applicationId: string,
  boothNumber: string,
  zone?: string,
  notes?: string
): Promise<{ error?: string }> {
  try {
    const staff = await getStaffUser()

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { assignment: { include: { booth: true } }, invoice: true },
    })
    if (!application) return { error: 'Application not found' }

    const newAssignment = await prisma.$transaction(async (tx) => {
      if (application.assignment) {
        await tx.boothAssignment.delete({ where: { id: application.assignment.id } })
        await tx.booth.update({
          where: { id: application.assignment.boothId },
          data: { status: 'AVAILABLE' },
        })
      }

      const booth = await tx.booth.upsert({
        where: {
          eventId_boothNumber: { eventId: application.eventId, boothNumber },
        },
        create: {
          eventId: application.eventId,
          boothNumber,
          zone: zone ?? null,
          status: 'ASSIGNED',
          notes: notes ?? null,
        },
        update: { zone: zone ?? null, status: 'ASSIGNED', notes: notes ?? null },
      })

      return tx.boothAssignment.create({
        data: {
          boothId: booth.id,
          applicationId,
          assignedById: staff.id,
          notes: notes ?? null,
        },
      })
    })

    // Keep invoice linked to new assignment if one already exists
    if (application.invoice) {
      await prisma.invoice.update({
        where: { id: application.invoice.id },
        data: { boothAssignmentId: newAssignment.id },
      })
    }

    revalidatePath(`/staff/applications/${applicationId}`)
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function generateInvoice(
  applicationId: string
): Promise<{ invoiceId?: string; error?: string }> {
  try {
    await getStaffUser()

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        vendor: true,
        boothType: true,
        weeks: {
          include: { eventWeek: true },
          orderBy: { eventWeek: { sortOrder: 'asc' } },
        },
        assignment: true,
        addOns: { include: { eventAddOn: true } },
        invoice: true,
      },
    })
    if (!application) return { error: 'Application not found' }
    if (!application.boothType) return { error: 'No booth type on application' }
    if (!application.assignment) return { error: 'Assign a booth first' }
    if (application.invoice) return { error: 'Invoice already exists' }

    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
    })
    let seq = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-')
      seq = parseInt(parts[2], 10) + 1
    }
    const invoiceNumber = `INV-${year}-${String(seq).padStart(4, '0')}`

    const weekLabels = application.weeks.map((w) => w.eventWeek.label).join(', ')
    const boothTotal = Number(application.boothType.basePrice) * application.weeks.length

    type LineItemInput = {
      description: string
      quantity: number
      unitPrice: number
      total: number
      sortOrder: number
    }

    const lineItems: LineItemInput[] = [
      {
        description: `${application.boothType.name} — ${weekLabels}`,
        quantity: application.weeks.length,
        unitPrice: Number(application.boothType.basePrice),
        total: boothTotal,
        sortOrder: 0,
      },
    ]

    application.addOns.forEach((ao, i) => {
      const addOnTotal = Number(ao.eventAddOn.price) * ao.quantity
      lineItems.push({
        description: ao.eventAddOn.name,
        quantity: ao.quantity,
        unitPrice: Number(ao.eventAddOn.price),
        total: addOnTotal,
        sortOrder: i + 1,
      })
    })

    const subtotal = lineItems.reduce((s, item) => s + item.total, 0)

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          vendorId: application.vendorId,
          applicationId,
          boothAssignmentId: application.assignment!.id,
          invoiceNumber,
          subtotal,
          tax: 0,
          total: subtotal,
          status: 'SENT',
        },
      })
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: inv.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      })
      return inv
    })

    // Fire-and-forget
    sendInvoiceEmail(invoice.id).catch((e) => console.error('Invoice email failed:', e))

    revalidatePath(`/staff/applications/${applicationId}`)
    return { invoiceId: invoice.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function resendInvoiceEmail(invoiceId: string): Promise<{ error?: string }> {
  try {
    await getStaffUser()
    const result = await sendInvoiceEmail(invoiceId)
    if (!result.success) return { error: result.error }
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}
