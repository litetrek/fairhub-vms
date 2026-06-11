import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const invoice = await prisma.invoice.findFirst({
      where: { stripeCheckoutSessionId: session.id },
      include: {
        payments: { where: { status: 'COMPLETED' } },
      },
    })

    // Idempotent: if invoice not found or already paid, acknowledge and stop
    if (!invoice) return NextResponse.json({ received: true })
    if (invoice.status === 'PAID') return NextResponse.json({ received: true })

    const amountPaid = (session.amount_total ?? 0) / 100

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: amountPaid,
        method: 'STRIPE',
        status: 'COMPLETED',
        referenceNumber: session.payment_intent as string,
        paidAt: new Date(),
        recordedById: null,
      },
    })

    const existingPaid = invoice.payments.reduce(
      (acc, p) => acc + Number(p.amount),
      0
    )
    const totalPaid = existingPaid + amountPaid
    const invoiceTotal = Number(invoice.total)

    const newStatus =
      totalPaid >= invoiceTotal
        ? ('PAID' as const)
        : totalPaid > 0
          ? ('PARTIALLY_PAID' as const)
          : ('SENT' as const)

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        stripePaymentIntentId: session.payment_intent as string,
      },
    })

    // TODO: Send payment confirmation email via Resend once RESEND_API_KEY is configured
  }

  return NextResponse.json({ received: true })
}
