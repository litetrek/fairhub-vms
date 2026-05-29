import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  CONDITIONALLY_APPROVED: 'bg-pink-50 text-pink-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
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
        take: 5,
      },
    },
  })

  if (!vendorProfile) redirect('/auth/login')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-900">
            Welcome, {vendorProfile.contactName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            2026 Annual Community Fair · Vendor Portal
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/applications/new">New application</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Applications</p>
            <p className="text-2xl font-medium">
              {vendorProfile.applications.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Documents uploaded</p>
            <p className="text-2xl font-medium">0 / 0</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Amount due</p>
            <p className="text-2xl font-medium">$0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">My applications</CardTitle>
        </CardHeader>
        <CardContent>
          {vendorProfile.applications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No applications yet</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/vendor/applications/new">
                  Submit your first application
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vendorProfile.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {app.boothSizePref || 'Booth'} ·{' '}
                      {app.boothTypePref || 'Any type'} ·{' '}
                      {app.productCategory || 'General'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.submittedAt
                        ? `Submitted ${new Date(app.submittedAt).toLocaleDateString()}`
                        : 'Not yet submitted'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[app.status]}`}
                    >
                      {statusLabels[app.status]}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      asChild
                    >
                      <Link href={`/vendor/applications/${app.id}`}>View</Link>
                    </Button>
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
