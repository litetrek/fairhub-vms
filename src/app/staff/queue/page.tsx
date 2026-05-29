import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { label: 'Pending review', value: '0', color: 'text-amber-600' },
  { label: 'Approved', value: '0', color: 'text-green-600' },
  { label: 'Docs incomplete', value: '0', color: 'text-red-500' },
  { label: 'Total applications', value: '0', color: 'text-slate-900' },
]

export default async function StaffQueuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-slate-900">
          Application review queue
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          2026 Annual Community Fair
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-medium ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No applications to review yet</p>
            <p className="text-xs mt-1">
              Applications will appear here once vendors submit them
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
