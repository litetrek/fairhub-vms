import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-green-50 text-green-700',
  CLOSED: 'bg-yellow-50 text-yellow-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
}

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { boothTypes: true, applications: true } },
    },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-900">Events</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage events and their setup</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">New event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-slate-400">No events yet.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/admin/events/new">Create your first event</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-slate-900 truncate">{event.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[event.status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {statusLabels[event.status] ?? event.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDateRange(event.eventDateStart, event.eventDateEnd)}
                      {event.location && ` · ${event.location}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {event._count.boothTypes} booth type{event._count.boothTypes !== 1 ? 's' : ''} ·{' '}
                      {event._count.applications} application{event._count.applications !== 1 ? 's' : ''}
                      {event.publicSlug && (
                        <> · <span className="font-mono">/fair/{event.publicSlug}</span></>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                      <Link href={`/admin/events/${event.id}/setup`}>Setup</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                      <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
