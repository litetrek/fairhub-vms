import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export default async function CheckInIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const events = await prisma.event.findMany({
    where: { status: { in: ['OPEN', 'CLOSED'] } },
    orderBy: { eventDateStart: 'asc' },
  })

  if (events.length === 1) {
    redirect(`/staff/checkin/${events[0].id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-slate-900">Event Day Check-In</h1>
        <p className="text-sm text-slate-500 mt-0.5">Select an event to begin checking in vendors</p>
      </div>

      {events.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <p className="text-sm">No active events found</p>
            <p className="text-xs mt-1">Events must have status Open or Closed to appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link key={event.id} href={`/staff/checkin/${event.id}`}>
              <Card className="border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="py-4">
                  <p className="font-medium text-slate-900">{event.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatDateRange(event.eventDateStart, event.eventDateEnd)}
                  </p>
                  {event.location && (
                    <p className="text-sm text-slate-400 mt-0.5">{event.location}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
