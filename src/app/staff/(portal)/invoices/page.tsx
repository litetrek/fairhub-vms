import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function StaffInvoicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!staffUser || (staffUser.role !== 'STAFF' && staffUser.role !== 'ADMIN')) {
    redirect('/auth/login')
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      vendor: true,
      application: { include: { event: true } },
      payments: { where: { status: 'COMPLETED' }, select: { amount: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
    .reduce((acc, inv) => acc + Number(inv.total), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            {totalOutstanding > 0 && (
              <span className="ml-2 text-amber-600">
                · ${totalOutstanding.toFixed(2)} outstanding
              </span>
            )}
          </p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">All invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No invoices yet</p>
              <p className="text-xs mt-1">Invoices are generated from approved application pages</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Invoice</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Vendor</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Event</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Issued</th>
                    <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">Total</th>
                    <th className="text-right text-xs font-medium text-slate-500 pb-3 pr-4">Paid</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => {
                    const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0)
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">{inv.invoiceNumber}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-slate-700">{inv.vendor.contactName}</p>
                          <p className="text-xs text-slate-400">{inv.vendor.businessName}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-700 text-xs">
                          {inv.application.event.name}
                        </td>
                        <td className="py-3 pr-4 text-slate-500 text-xs">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          ${Number(inv.total).toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          {paid > 0 ? (
                            <span className="text-green-700">${paid.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {inv.status.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                            <Link href={`/staff/invoices/${inv.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
