'use server'

import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'noreply@vendor.cyber-tech.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendInvoiceEmail(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        vendor: { include: { user: true } },
        application: {
          include: {
            event: true,
            boothType: true,
            weeks: {
              include: { eventWeek: true },
              orderBy: { eventWeek: { sortOrder: 'asc' } },
            },
            assignment: { include: { booth: true } },
          },
        },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!invoice) return { success: false, error: 'Invoice not found' }

    const { vendor, application, lineItems } = invoice
    const event = application.event
    const booth = application.assignment?.booth
    const weekLabels = application.weeks.map((w) => w.eventWeek.label).join(', ')

    const lineItemRows = lineItems
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">${item.description}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${Number(item.unitPrice).toFixed(2)}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${Number(item.total).toFixed(2)}</td>
          </tr>`
      )
      .join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <p>Dear ${vendor.businessName},</p>
        <p>Your booth invoice for <strong>${event.name}</strong> is ready.</p>
        <p>
          <strong>Invoice:</strong> ${invoice.invoiceNumber}<br>
          ${booth ? `<strong>Booth:</strong> ${booth.boothNumber}${booth.zone ? ` — ${booth.zone}` : ''}<br>` : ''}
          <strong>Weeks confirmed:</strong> ${weekLabels}
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;font-size:13px">Description</th>
              <th style="padding:8px 12px;text-align:center;font-size:13px">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:13px">Unit Price</th>
              <th style="padding:8px 12px;text-align:right;font-size:13px">Total</th>
            </tr>
          </thead>
          <tbody>${lineItemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:8px 12px;text-align:right;font-weight:600">Total Due</td>
              <td style="padding:8px 12px;text-align:right;font-weight:600">$${Number(invoice.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p>
          Pay online at
          <a href="${APP_URL}/vendor/invoices/${invoiceId}">${APP_URL}/vendor/invoices/${invoiceId}</a>
          or contact us to arrange check/Zelle payment.
        </p>
        <p style="color:#64748b;font-size:13px">— VendorHub Team</p>
      </div>
    `

    const { error } = await resend.emails.send({
      from: FROM,
      to: vendor.user.email,
      subject: `Your booth invoice for ${event.name} — ${invoice.invoiceNumber}`,
      html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('sendInvoiceEmail error:', e)
    return { success: false, error: String(e) }
  }
}

export async function sendPaymentConfirmationEmail(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            vendor: { include: { user: true } },
            application: {
              include: {
                event: true,
                assignment: { include: { booth: true } },
              },
            },
            payments: { where: { status: 'COMPLETED' } },
          },
        },
      },
    })
    if (!payment) return { success: false, error: 'Payment not found' }

    const { invoice } = payment
    const { vendor, application } = invoice
    const event = application.event
    const booth = application.assignment?.booth

    const totalPaid = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    const remaining = Number(invoice.total) - totalPaid
    const isFullyPaid = remaining <= 0.005

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <p>Dear ${vendor.businessName},</p>
        <p>We have received your payment for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
        <p>
          <strong>Amount paid:</strong> $${Number(payment.amount).toFixed(2)}<br>
          <strong>Method:</strong> ${payment.method}<br>
          <strong>Date:</strong> ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
          ${payment.referenceNumber ? `<br><strong>Reference:</strong> ${payment.referenceNumber}` : ''}
        </p>
        ${!isFullyPaid ? `<p><strong>Remaining balance:</strong> $${remaining.toFixed(2)}</p>` : ''}
        ${isFullyPaid ? `<p><strong>You're all set! See you at ${event.name}.</strong></p>` : ''}
        ${booth ? `<p><strong>Your booth:</strong> ${booth.boothNumber}${booth.zone ? ` — ${booth.zone}` : ''}</p>` : ''}
        <p style="color:#64748b;font-size:13px">— VendorHub Team</p>
      </div>
    `

    const { error } = await resend.emails.send({
      from: FROM,
      to: vendor.user.email,
      subject: `Payment received — ${invoice.invoiceNumber}`,
      html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('sendPaymentConfirmationEmail error:', e)
    return { success: false, error: String(e) }
  }
}
