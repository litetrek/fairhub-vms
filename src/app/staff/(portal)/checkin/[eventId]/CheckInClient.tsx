'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

type Assignment = {
  id: string
  checkedIn: boolean
  checkedInAt: string | null
  checkedInByEmail: string | null
  booth: { boothNumber: string; zone: string | null }
  application: { vendor: { businessName: string; contactName: string } }
}

type Event = {
  id: string
  name: string
  eventDateStart: string
  eventDateEnd: string
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${new Date(start).toLocaleDateString('en-US', opts)} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

export default function CheckInClient({
  event,
  initialAssignments,
}: {
  event: Event
  initialAssignments: Assignment[]
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [filter, setFilter] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter(
      (a) =>
        a.application.vendor.businessName.toLowerCase().includes(q) ||
        a.application.vendor.contactName.toLowerCase().includes(q) ||
        a.booth.boothNumber.toLowerCase().includes(q)
    )
  }, [assignments, filter])

  const checkedInCount = assignments.filter((a) => a.checkedIn).length

  async function handleCheckIn(assignmentId: string) {
    setLoadingId(assignmentId)
    try {
      const res = await fetch('/api/staff/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Check-in failed')
      }
      const updated = await res.json()
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                checkedIn: true,
                checkedInAt: updated.checkedInAt ?? new Date().toISOString(),
              }
            : a
        )
      )
      toast.success('Vendor checked in')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="text-xs -ml-2 mb-1" asChild>
            <Link href="/staff/checkin">← Back to Events</Link>
          </Button>
          <h1 className="text-xl font-medium text-slate-900">{event.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatDateRange(event.eventDateStart, event.eventDateEnd)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-medium text-slate-900">
            {checkedInCount}
            <span className="text-slate-400 text-lg font-normal"> / {assignments.length}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">vendors checked in</p>
        </div>
      </div>

      {/* Filter */}
      <input
        type="search"
        placeholder="Search by business, vendor name, or booth #…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
      />

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <p className="text-sm">
              {filter ? 'No vendors match your search' : 'No approved vendors for this event'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Booth</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Business</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Contact</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{a.booth.boothNumber}</p>
                          {a.booth.zone && (
                            <p className="text-xs text-slate-400">{a.booth.zone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {a.application.vendor.businessName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {a.application.vendor.contactName}
                        </td>
                        <td className="px-4 py-3">
                          {a.checkedIn && a.checkedInAt ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full"
                              title={a.checkedInByEmail ? `Checked in by ${a.checkedInByEmail}` : undefined}
                            >
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              {formatTime(a.checkedInAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not checked in</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!a.checkedIn && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={loadingId === a.id}
                              onClick={() => handleCheckIn(a.id)}
                            >
                              {loadingId === a.id ? 'Checking in…' : 'Check In'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((a) => (
              <Card key={a.id} className="border-slate-200">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          Booth {a.booth.boothNumber}
                        </span>
                        {a.booth.zone && (
                          <span className="text-xs text-slate-400">{a.booth.zone}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5 truncate">
                        {a.application.vendor.businessName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {a.application.vendor.contactName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {a.checkedIn && a.checkedInAt ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full"
                          title={a.checkedInByEmail ? `Checked in by ${a.checkedInByEmail}` : undefined}
                        >
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          {formatTime(a.checkedInAt)}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={loadingId === a.id}
                          onClick={() => handleCheckIn(a.id)}
                        >
                          {loadingId === a.id ? '…' : 'Check In'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
