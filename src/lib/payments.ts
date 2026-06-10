'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmationEmail } from '@/lib/email'

async function getStaffUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!staffUser || (staffUser.role !== 'STAFF' && staffUser.role !== 'ADMIN')) {
    throw new Error('Not authorized')
  }
  return user.id
}

export async function recordPayment(params: {
  invoiceId: string
  method: 'CHECK' | 'ZELLE'
  amount: number
  paidAt: string
  referenceNumber?: string
  notes?: string
}): Promise<{ error?: string }> {
  try {
    const recordedById = await getStaffUserId()

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { payments: { where: { status: 'COMPLETED' } } },
    })
    if (!invoice) return { error: 'Invoice not found' }

    const previousPaid = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    const newPaidTotal = previousPaid + params.amount
    const invoiceTotal = Number(invoice.total)
    const newStatus: 'PAID' | 'PARTIALLY_PAID' =
      newPaidTotal >= invoiceTotal - 0.005 ? 'PAID' : 'PARTIALLY_PAID'

    const payment = await prisma.$transaction(async (tx) => {
      const pmt = await tx.payment.create({
        data: {
          invoiceId: params.invoiceId,
          amount: params.amount,
          method: params.method,
          status: 'COMPLETED',
          referenceNumber: params.referenceNumber ?? null,
          notes: params.notes ?? null,
          recordedById,
          paidAt: new Date(params.paidAt),
        },
      })
      await tx.invoice.update({
        where: { id: params.invoiceId },
        data: { status: newStatus },
      })
      return pmt
    })

    // Fire-and-forget
    sendPaymentConfirmationEmail(payment.id).catch((e) =>
      console.error('Payment confirmation email failed:', e)
    )

    revalidatePath(`/staff/invoices/${params.invoiceId}`)
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function resendPaymentConfirmation(
  paymentId: string
): Promise<{ error?: string }> {
  try {
    await getStaffUserId()
    const result = await sendPaymentConfirmationEmail(paymentId)
    if (!result.success) return { error: result.error }
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}
