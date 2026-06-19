import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import QueueFilters from './QueueFilters'

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700',
  CONDITIONALLY_APPROVED: 'bg-purple-50 text-purple-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  DRAFT: 'bg-slate-100 text-slate-600',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Cond. approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
}

const ALL_STAFF_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CONDITIONALLY_APPROVED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
] as const

const FILTERABLE_STATUSES = [...ALL_STAFF_STATUSES]

export default async function StaffQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { status: filterStatus } = await searchParams

  const statusFilter =
    filterStatus && FILTERABLE_STATUSES.includes(filterStatus as never)
      ? { status: filterStatus as never }
      : { status: { in: ALL_STAFF_STATUSES as unknown as never[] } }

  const [applications, stats] = await Promise.all([
    prisma.application.findMany({
      where: statusFilter,
      include: {
        vendor: { include: { user: true } },
        event: true,
        boothType: true,
        weeks: { include: { eventWeek: true }, orderBy: { eventWeek: { sortOrder: 'asc' } } },
      },
      orderBy: { submittedAt: 'asc' },
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const countByStatus = Object.fromEntries(
    stats.map((s) => [s.status, s._count])
  )

  const statCards = [
    {
      label: 'Pending review',
      value: countByStatus['SUBMITTED'] ?? 0,
      color: 'text-amber-600',
    },
    {
      label: 'Under review',
      value: countByStatus['UNDER_REVIEW'] ?? 0,
      color: 'text-blue-600',
    },
    {
      label: 'Approved',
      value: countByStatus['APPROVED'] ?? 0,
      color: 'text-green-600',
    },
    {
      label: 'Total applications',
      value: Object.entries(countByStatus)
        .filter(([s]) => s !== 'DRAFT')
        .reduce((a, [, b]) => a + b, 0),
      color: 'text-slate-900',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-slate-900">Application review queue</h1>
        <p className="text-sm text-slate-500 mt-0.5">Summer Fair 2026</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-medium ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Applications</CardTitle>
          <QueueFilters current={filterStatus} />
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No applications match this filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Vendor</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Booth type</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Weeks</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Submitted</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{app.vendor.contactName}</p>
                        <p className="text-xs text-slate-400">{app.vendor.businessName}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {app.boothType?.name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {app.weeks.length > 0
                          ? app.weeks.map((w) => w.eventWeek.label).join(', ')
                          : '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[app.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {statusLabels[app.status] ?? app.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                          <Link href={`/staff/applications/${app.id}`}>
                            {app.status === 'APPROVED' ? 'Manage' : 'Review'}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
