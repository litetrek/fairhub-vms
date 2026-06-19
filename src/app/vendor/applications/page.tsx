import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SUBMITTED: 'status-badge-info',
  UNDER_REVIEW: 'status-badge-pending',
  CONDITIONALLY_APPROVED: 'status-badge-secondary-state',
  APPROVED: 'status-badge-approved',
  REJECTED: 'status-badge-rejected',
  WITHDRAWN: 'status-badge-draft',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Conditionally approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export default async function VendorApplicationsPage() {
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
        },
      },
    },
  })
  if (!vendorProfile) redirect('/auth/login')

  const apps = vendorProfile.applications

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground">My applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {apps.length} application{apps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/applications/new">New application</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">All applications</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No applications yet</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/vendor/applications/new">Submit your first application</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {apps.map((app) => (
                <Link
                  key={app.id}
                  href={`/vendor/applications/${app.id}`}
                  className="flex items-center justify-between gap-4 py-4 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors"
                >
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
                    {app.status === 'REJECTED' && (
                      <p className="text-xs text-destructive mt-0.5">Changes requested by staff</p>
                    )}
                    {app.status === 'WITHDRAWN' && (
                      <p className="text-xs text-muted-foreground mt-0.5">You have withdrawn this application</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? 'status-badge-draft'}`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
