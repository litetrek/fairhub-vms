import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await prisma.invoice.findFirst({
    where: { id, vendorId: vendorProfile.id },
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' } },
      vendor: { include: { user: true } },
      application: { include: { event: true } },
    },
  })

  if (!invoice)
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  if (!['SENT', 'PARTIALLY_PAID'].includes(invoice.status)) {
    return NextResponse.json({ error: 'Invoice is not payable' }, { status: 400 })
  }

  // Reuse existing session if still open
  if (invoice.stripeCheckoutSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(
      invoice.stripeCheckoutSessionId
    )
    if (existing.status === 'open') {
      return NextResponse.json({ url: existing.url })
    }
  }

  const lineItems = invoice.lineItems.map((item) => ({
    price_data: {
      currency: 'usd' as const,
      unit_amount: Math.round(Number(item.unitPrice) * 100),
      product_data: { name: item.description },
    },
    quantity: item.quantity,
  }))

  if (Number(invoice.tax) > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd' as const,
        unit_amount: Math.round(Number(invoice.tax) * 100),
        product_data: { name: 'Tax' },
      },
      quantity: 1,
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: invoice.vendor.user.email,
    line_items: lineItems,
    success_url: `${baseUrl}/vendor/invoices/${invoice.id}?payment=success`,
    cancel_url: `${baseUrl}/vendor/invoices/${invoice.id}?payment=cancelled`,
    metadata: {
      invoiceId: invoice.id,
      vendorId: invoice.vendorId,
    },
    expires_at: Math.floor(Date.now() / 1000) + 1800,
  })

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutSessionId: session.id },
  })

  return NextResponse.json({ url: session.url })
}
