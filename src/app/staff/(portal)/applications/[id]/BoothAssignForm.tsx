'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { assignBooth } from '@/lib/invoices'

type Props = {
  applicationId: string
  existing: {
    boothNumber: string
    zone: string | null
    notes: string | null
  } | null
}

export default function BoothAssignForm({ applicationId, existing }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(!existing)
  const [boothNumber, setBoothNumber] = useState(existing?.boothNumber ?? '')
  const [zone, setZone] = useState(existing?.zone ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!boothNumber.trim()) {
      toast.error('Booth number is required')
      return
    }
    setIsLoading(true)
    try {
      const result = await assignBooth(
        applicationId,
        boothNumber.trim(),
        zone.trim() || undefined,
        notes.trim() || undefined
      )
      if (result.error) throw new Error(result.error)
      toast.success(existing ? 'Booth reassigned' : 'Booth assigned')
      setIsEditing(false)
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  if (existing && !isEditing) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Booth assignment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-slate-400">Booth number</p>
                <p className="text-slate-700 font-medium">{existing.boothNumber}</p>
              </div>
              {existing.zone && (
                <div>
                  <p className="text-xs text-slate-400">Zone</p>
                  <p className="text-slate-700">{existing.zone}</p>
                </div>
              )}
              {existing.notes && (
                <div>
                  <p className="text-xs text-slate-400">Notes</p>
                  <p className="text-slate-700">{existing.notes}</p>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Reassign booth
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {existing ? 'Reassign booth' : 'Assign booth'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Booth number <span className="text-slate-400 font-normal">(required)</span>
            </label>
            <input
              type="text"
              value={boothNumber}
              onChange={(e) => setBoothNumber(e.target.value)}
              placeholder="e.g. A-12"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Zone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g. Food Court"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 justify-end">
            {existing && (
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : existing ? 'Update assignment' : 'Assign booth'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
