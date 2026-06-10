import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function StaffBoothMapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const assignments = await prisma.boothAssignment.findMany({
    include: {
      booth: true,
      application: {
        include: {
          vendor: true,
          event: true,
          boothType: true,
          weeks: {
            include: { eventWeek: true },
            orderBy: { eventWeek: { sortOrder: 'asc' } },
          },
          invoice: { select: { id: true, status: true, total: true } },
        },
      },
      assignedBy: { select: { email: true } },
    },
    orderBy: { booth: { boothNumber: 'asc' } },
  })

  const INVOICE_STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-50 text-blue-700',
    PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
    PAID: 'bg-green-50 text-green-700',
    OVERDUE: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-slate-900">Booth map</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {assignments.length} booth{assignments.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Current assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No booths assigned yet</p>
              <p className="text-xs mt-1">
                Approve applications and assign booths from the review queue
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Booth</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Zone</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Vendor</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Booth type</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Weeks</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Invoice</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{a.booth.boothNumber}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {a.booth.zone ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-slate-900">{a.application.vendor.contactName}</p>
                        <p className="text-xs text-slate-400">{a.application.vendor.businessName}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {a.application.boothType?.name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-700 text-xs">
                        {a.application.weeks.length > 0
                          ? a.application.weeks.map((w) => w.eventWeek.label).join(', ')
                          : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {a.application.invoice ? (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[a.application.invoice.status] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {a.application.invoice.status.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">no invoice</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                          <Link href={`/staff/applications/${a.applicationId}`}>View</Link>
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
