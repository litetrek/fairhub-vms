import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SENT: 'status-badge-info',
  PARTIALLY_PAID: 'status-badge-pending',
  PAID: 'status-badge-approved',
  OVERDUE: 'status-badge-rejected',
  CANCELLED: 'status-badge-draft',
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const METHOD_LABELS: Record<string, string> = {
  CHECK: 'Check',
  ZELLE: 'Zelle',
  CREDIT_CARD: 'Credit Card',
}

export default async function VendorInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/auth/login')

  const invoice = await prisma.invoice.findFirst({
    where: { id, vendorId: vendorProfile.id },
    include: {
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
      payments: {
        where: { status: 'COMPLETED' },
        orderBy: { paidAt: 'desc' },
      },
    },
  })

  if (!invoice) notFound()

  const { application, lineItems, payments } = invoice
  const booth = application.assignment?.booth
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0)
  const remaining = Number(invoice.total) - totalPaid
  const isPaid = invoice.status === 'PAID'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
              <Link href="/vendor/dashboard">← Dashboard</Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-foreground">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{application.event.name}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${INVOICE_STATUS_COLORS[invoice.status] ?? 'status-badge-draft'}`}
        >
          {invoice.status.toLowerCase().replace(/_/g, ' ')}
        </span>
      </div>

      {/* Event & booth info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Your booking</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {booth && (
            <div>
              <p className="text-xs text-muted-foreground">Booth</p>
              <p className="text-foreground font-medium">
                {booth.boothNumber}
                {booth.zone ? ` — ${booth.zone}` : ''}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Weeks</p>
            {application.weeks.map((w) => (
              <p key={w.id} className="text-foreground">{w.eventWeek.label}</p>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Invoice date</p>
            <p className="text-foreground">{formatDate(invoice.issuedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Description</th>
                <th className="text-center pb-2 font-medium w-16">Qty</th>
                <th className="text-right pb-2 font-medium w-28">Unit Price</th>
                <th className="text-right pb-2 font-medium w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 text-foreground">{item.description}</td>
                  <td className="py-2.5 text-center text-foreground">{item.quantity}</td>
                  <td className="py-2.5 text-right text-foreground">
                    ${Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right text-foreground">
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={3} className="pt-3 text-right font-medium text-foreground">
                  Total
                </td>
                <td className="pt-3 text-right font-medium text-foreground">
                  ${Number(invoice.total).toFixed(2)}
                </td>
              </tr>
              {totalPaid > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right text-muted-foreground text-xs">
                      Paid
                    </td>
                    <td className="pt-1 text-right text-accent text-xs">
                      −${totalPaid.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right font-medium text-foreground">
                      Balance due
                    </td>
                    <td className="pt-1 text-right font-medium text-foreground">
                      ${remaining.toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Payment history */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payments received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {payments.map((pmt) => (
                <div key={pmt.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm text-foreground">
                      {METHOD_LABELS[pmt.method] ?? pmt.method}
                      {pmt.referenceNumber && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          #{pmt.referenceNumber}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(pmt.paidAt)}</p>
                  </div>
                  <p className="text-sm font-medium text-accent">
                    ${Number(pmt.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        {isPaid ? (
          <p className="text-sm text-accent font-medium">
            Paid in full — see you at the event!
          </p>
        ) : (
          <p className="text-sm text-foreground">
            Balance due: <span className="font-medium">${remaining.toFixed(2)}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              Contact us to arrange check/Zelle payment.
            </span>
          </p>
        )}
        <Button disabled title="Online payment coming soon">
          Pay now (coming soon)
        </Button>
      </div>
    </div>
  )
}
