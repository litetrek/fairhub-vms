import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SUBMITTED: 'status-badge-info',
  UNDER_REVIEW: 'status-badge-pending',
  CONDITIONALLY_APPROVED: 'status-badge-secondary-state',
  APPROVED: 'status-badge-approved',
  REJECTED: 'status-badge-rejected',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Cond. approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
        include: {
          event: true,
          boothType: true,
          weeks: { include: { eventWeek: true } },
          documents: true,
          invoice: true,
        },
      },
    },
  })

  if (!vendorProfile) redirect('/auth/login')

  const totalDocs = vendorProfile.applications.reduce(
    (acc, app) => acc + app.documents.length,
    0
  )

  const amountDue = vendorProfile.applications.reduce((acc, app) => {
    if (!app.invoice) return acc
    if (app.invoice.status === 'PAID' || app.invoice.status === 'CANCELLED') return acc
    return acc + Number(app.invoice.total)
  }, 0)

  const unpaidInvoices = vendorProfile.applications
    .filter(
      (app) =>
        app.status === 'APPROVED' &&
        app.invoice &&
        app.invoice.status !== 'PAID' &&
        app.invoice.status !== 'CANCELLED'
    )
    .map((app) => app.invoice!)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {unpaidInvoices.length > 0 && (
        <div className="border-l-4 border-amber-500 bg-amber-500/10 rounded-r-lg px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-foreground">
            You have {unpaidInvoices.length === 1 ? 'an unpaid invoice' : `${unpaidInvoices.length} unpaid invoices`} — pay now to secure your booth.
          </p>
          <Button size="sm" asChild className="shrink-0">
            <Link href={unpaidInvoices.length === 1 ? `/vendor/invoices/${unpaidInvoices[0].id}` : '/vendor/invoices'}>
              Pay now
            </Link>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground">
            Welcome, {vendorProfile.contactName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vendorProfile.businessName} · Vendor Portal
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/applications/new">New application</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Applications</p>
            <p className="text-2xl font-medium text-foreground">{vendorProfile.applications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Documents uploaded</p>
            <p className="text-2xl font-medium text-foreground">{totalDocs}</p>
          </CardContent>
        </Card>
        {amountDue > 0 ? (
          <Link href="/vendor/invoices" className="block group">
            <Card className="transition-colors group-hover:border-primary/50">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground mb-1">Amount due</p>
                <p className="text-2xl font-medium text-foreground">${amountDue.toFixed(2)}</p>
                <p className="text-xs text-primary mt-1">Pay now →</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Amount due</p>
              <p className="text-2xl font-medium text-foreground">${amountDue.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">My applications</CardTitle>
        </CardHeader>
        <CardContent>
          {vendorProfile.applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No applications yet</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/vendor/applications/new">Submit your first application</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {vendorProfile.applications.map((app) => (
                <div key={app.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {app.boothType?.name ?? 'Booth type not selected'}
                        {app.weeks.length > 0 &&
                          ` · ${app.weeks.length} week${app.weeks.length !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {app.event.name}
                        {app.submittedAt
                          ? ` · Submitted ${new Date(app.submittedAt).toLocaleDateString()}`
                          : ' · Not yet submitted'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColors[app.status] ?? 'status-badge-draft'}`}
                    >
                      {statusLabels[app.status]}
                    </span>
                  </div>

                  {app.status === 'REJECTED' && app.rejectionNote && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                      <span className="font-medium">Rejection note: </span>
                      {app.rejectionNote}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {app.status === 'DRAFT' && (
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/vendor/applications/${app.id}/edit`}>Continue</Link>
                      </Button>
                    )}
                    {app.status === 'REJECTED' && (
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/vendor/applications/${app.id}/edit`}>Edit & resubmit</Link>
                      </Button>
                    )}
                    {app.status !== 'DRAFT' && app.status !== 'REJECTED' && (
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/vendor/applications/${app.id}`}>View</Link>
                      </Button>
                    )}
                    {app.invoice && (
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/vendor/invoices/${app.invoice.id}`}>View invoice</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
