import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SENT: 'status-badge-info',
  PARTIALLY_PAID: 'status-badge-pending',
  PAID: 'status-badge-approved',
  OVERDUE: 'status-badge-rejected',
  CANCELLED: 'status-badge-draft',
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function VendorInvoicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/auth/login')

  const invoices = await prisma.invoice.findMany({
    where: { vendorId: vendorProfile.id },
    include: {
      application: { include: { event: true } },
      payments: { where: { status: 'COMPLETED' }, select: { amount: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })

  const totalDue = invoices
    .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
    .reduce((acc, inv) => acc + Number(inv.total), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">My invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          {totalDue > 0 && (
            <span className="ml-2 text-amber-500">· ${totalDue.toFixed(2)} outstanding</span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No invoices yet</p>
              <p className="text-xs mt-1">Invoices will appear here after your application is approved and a booth is assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => {
                const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0)
                const remaining = Number(inv.total) - paid
                return (
                  <div key={inv.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.application.event.name}
                        {' · '}Issued {formatDate(inv.issuedAt)}
                      </p>
                      {inv.dueDate && (
                        <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          ${Number(inv.total).toFixed(2)}
                        </p>
                        {remaining > 0 && remaining < Number(inv.total) && (
                          <p className="text-xs text-amber-500">${remaining.toFixed(2)} due</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? 'status-badge-draft'}`}
                      >
                        {inv.status.toLowerCase().replace(/_/g, ' ')}
                      </span>
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/vendor/invoices/${inv.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
