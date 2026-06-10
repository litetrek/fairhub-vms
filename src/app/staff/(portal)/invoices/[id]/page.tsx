import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import RecordPaymentModal, { ResendConfirmationButton } from './RecordPaymentModal'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
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

export default async function StaffInvoicePage({
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

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!staffUser || (staffUser.role !== 'STAFF' && staffUser.role !== 'ADMIN')) {
    redirect('/auth/login')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
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
      payments: {
        where: { status: 'COMPLETED' },
        orderBy: { paidAt: 'desc' },
      },
    },
  })

  if (!invoice) notFound()

  const { vendor, application, lineItems, payments } = invoice
  const booth = application.assignment?.booth
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0)
  const remaining = Number(invoice.total) - totalPaid

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs -ml-2"
              asChild
            >
              <Link href={`/staff/applications/${application.id}`}>
                ← Application
              </Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-slate-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{application.event.name}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${INVOICE_STATUS_COLORS[invoice.status] ?? 'bg-slate-100 text-slate-600'}`}
        >
          {invoice.status.toLowerCase().replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Vendor */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium text-slate-900">{vendor.contactName}</p>
            <p className="text-slate-500">{vendor.businessName}</p>
            <p className="text-xs text-slate-400">{vendor.user.email}</p>
          </CardContent>
        </Card>

        {/* Booth & dates */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {booth && (
              <div>
                <p className="text-xs text-slate-400">Booth</p>
                <p className="text-slate-700">
                  {booth.boothNumber}
                  {booth.zone ? ` — ${booth.zone}` : ''}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Weeks</p>
              {application.weeks.map((w) => (
                <p key={w.id} className="text-slate-700">{w.eventWeek.label}</p>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-400">Issued</p>
              <p className="text-slate-700">{formatDate(invoice.issuedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Description</th>
                <th className="text-center pb-2 font-medium w-16">Qty</th>
                <th className="text-right pb-2 font-medium w-28">Unit Price</th>
                <th className="text-right pb-2 font-medium w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 text-slate-700">{item.description}</td>
                  <td className="py-2.5 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-700">
                    ${Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right text-slate-700">
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="pt-3 text-right font-medium text-slate-900">
                  Total
                </td>
                <td className="pt-3 text-right font-medium text-slate-900">
                  ${Number(invoice.total).toFixed(2)}
                </td>
              </tr>
              {totalPaid > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right text-slate-500 text-xs">
                      Paid
                    </td>
                    <td className="pt-1 text-right text-green-600 text-xs">
                      −${totalPaid.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right font-medium text-slate-900">
                      Balance due
                    </td>
                    <td className="pt-1 text-right font-medium text-slate-900">
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
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {payments.map((pmt) => (
                <div key={pmt.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm text-slate-700">
                      {METHOD_LABELS[pmt.method] ?? pmt.method}
                      {pmt.referenceNumber && (
                        <span className="text-slate-400 ml-2 text-xs">
                          #{pmt.referenceNumber}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(pmt.paidAt)}</p>
                    {pmt.notes && (
                      <p className="text-xs text-slate-500">{pmt.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      ${Number(pmt.amount).toFixed(2)}
                    </p>
                    <ResendConfirmationButton paymentId={pmt.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <RecordPaymentModal invoiceId={invoice.id} remainingBalance={remaining} />
    </div>
  )
}
