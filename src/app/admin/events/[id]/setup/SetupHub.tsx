'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Types ──────────────────────────────────────────────────────────────────

type DocReq = {
  id: string
  boothTypeId: string
  docType: string
  required: boolean
  notes: string | null
}

type BoothType = {
  id: string
  name: string
  description: string | null
  whatsIncluded: string | null
  basePrice: number
  sizeSqft: number | null
  totalCount: number
  sortOrder: number
  docRequirements: DocReq[]
}

type AddOn = {
  id: string
  name: string
  description: string | null
  price: number
  boothTypeId: string | null
  boothTypeName: string | null
  sortOrder: number
}

type Week = {
  id: string
  label: string
  startDate: string
  endDate: string
  sortOrder: number
}

type Props = {
  eventId: string
  boothTypes: BoothType[]
  addOns: AddOn[]
  weeks: Week[]
}

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

const ALL_DOC_TYPES = Object.keys(DOC_TYPE_LABELS)

// ── Component ──────────────────────────────────────────────────────────────

export default function SetupHub({ eventId, boothTypes: initialBTs, addOns: initialAOs, weeks: initialWeeks }: Props) {
  const router = useRouter()

  // Booth types & add-ons — kept in state to allow inline delete
  const [boothTypes, setBoothTypes] = useState<BoothType[]>(initialBTs)
  const [addOns, setAddOns] = useState<AddOn[]>(initialAOs)

  // Weeks state — full inline CRUD
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks)
  const [weekAdding, setWeekAdding] = useState(false)
  const [weekEditing, setWeekEditing] = useState<string | null>(null)
  const [weekForm, setWeekForm] = useState({ label: '', startDate: '', endDate: '', sortOrder: '0' })

  // Doc requirements state — inline add/delete per booth type
  const [docReqs, setDocReqs] = useState<DocReq[]>(initialBTs.flatMap((bt) => bt.docRequirements))
  const [docReqAdding, setDocReqAdding] = useState<string | null>(null) // boothTypeId
  const [docReqForm, setDocReqForm] = useState({ docType: 'BUSINESS_LICENSE', required: true, notes: '' })

  // ── Booth Type delete ────────────────────────────────────────────────────

  async function deleteBT(btId: string) {
    const res = await fetch(`/api/admin/booth-types/${btId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setBoothTypes((prev) => prev.filter((bt) => bt.id !== btId))
    setDocReqs((prev) => prev.filter((dr) => dr.boothTypeId !== btId))
    toast.success('Booth type deleted')
    router.refresh()
  }

  // ── Add-On delete ────────────────────────────────────────────────────────

  async function deleteAO(aoId: string) {
    const res = await fetch(`/api/admin/addons/${aoId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setAddOns((prev) => prev.filter((ao) => ao.id !== aoId))
    toast.success('Add-on deleted')
    router.refresh()
  }

  // ── Week CRUD ────────────────────────────────────────────────────────────

  function startAddWeek() {
    setWeekForm({ label: '', startDate: '', endDate: '', sortOrder: String(weeks.length) })
    setWeekAdding(true)
    setWeekEditing(null)
  }

  function startEditWeek(week: Week) {
    setWeekForm({ label: week.label, startDate: week.startDate, endDate: week.endDate, sortOrder: String(week.sortOrder) })
    setWeekEditing(week.id)
    setWeekAdding(false)
  }

  async function saveWeek() {
    const { label, startDate, endDate, sortOrder } = weekForm
    if (!label || !startDate || !endDate) { toast.error('Label, start date, and end date are required'); return }

    if (weekAdding) {
      const res = await fetch(`/api/admin/events/${eventId}/weeks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, startDate, endDate, sortOrder: Number(sortOrder) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setWeeks((prev) => [...prev, { id: data.id, label: data.label, startDate: data.startDate.split('T')[0], endDate: data.endDate.split('T')[0], sortOrder: data.sortOrder }])
      setWeekAdding(false)
      toast.success('Week added')
    } else if (weekEditing) {
      const res = await fetch(`/api/admin/weeks/${weekEditing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, startDate, endDate, sortOrder: Number(sortOrder) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setWeeks((prev) => prev.map((w) => w.id === weekEditing ? { ...w, label: data.label, startDate: data.startDate.split('T')[0], endDate: data.endDate.split('T')[0], sortOrder: data.sortOrder } : w))
      setWeekEditing(null)
      toast.success('Week updated')
    }
    router.refresh()
  }

  async function deleteWeek(wkId: string) {
    const res = await fetch(`/api/admin/weeks/${wkId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setWeeks((prev) => prev.filter((w) => w.id !== wkId))
    toast.success('Week deleted')
    router.refresh()
  }

  // ── Doc Requirement CRUD ─────────────────────────────────────────────────

  function startAddDocReq(btId: string) {
    setDocReqForm({ docType: 'BUSINESS_LICENSE', required: true, notes: '' })
    setDocReqAdding(btId)
  }

  async function saveDocReq(btId: string) {
    const { docType, required, notes } = docReqForm
    const res = await fetch(`/api/admin/booth-types/${btId}/doc-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, required, notes: notes || null }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setDocReqs((prev) => [...prev, { id: data.id, boothTypeId: btId, docType: data.docType, required: data.required, notes: data.notes }])
    setDocReqAdding(null)
    toast.success('Document requirement added')
    router.refresh()
  }

  async function deleteDocReq(drId: string) {
    const res = await fetch(`/api/admin/doc-requirements/${drId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setDocReqs((prev) => prev.filter((dr) => dr.id !== drId))
    toast.success('Requirement removed')
    router.refresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="booth-types">
      <TabsList variant="line" className="mb-4">
        <TabsTrigger value="booth-types">Booth Types ({boothTypes.length})</TabsTrigger>
        <TabsTrigger value="addons">Add-Ons ({addOns.length})</TabsTrigger>
        <TabsTrigger value="weeks">Weeks ({weeks.length})</TabsTrigger>
        <TabsTrigger value="doc-reqs">Doc Requirements</TabsTrigger>
      </TabsList>

      {/* ── Booth Types tab ──────────────────────────────────────────────── */}
      <TabsContent value="booth-types">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Booth types</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/admin/events/${eventId}/setup/booth-types/new`}>Add booth type</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {boothTypes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No booth types yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {boothTypes.map((bt) => (
                  <div key={bt.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{bt.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ${bt.basePrice.toFixed(2)} · {bt.totalCount} total
                        {bt.sizeSqft && ` · ${bt.sizeSqft} sqft`}
                      </p>
                      {bt.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{bt.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/admin/events/${eventId}/setup/booth-types/${bt.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Delete "${bt.name}"? This cannot be undone.`)) deleteBT(bt.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Add-Ons tab ──────────────────────────────────────────────────── */}
      <TabsContent value="addons">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Event add-ons</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/admin/events/${eventId}/setup/addons/new`}>Add add-on</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {addOns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No add-ons yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {addOns.map((ao) => (
                  <div key={ao.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{ao.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ${ao.price.toFixed(2)} ·{' '}
                        {ao.boothTypeName ? `${ao.boothTypeName} only` : 'All booth types'}
                      </p>
                      {ao.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ao.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                        <Link href={`/admin/events/${eventId}/setup/addons/${ao.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Delete "${ao.name}"?`)) deleteAO(ao.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Weeks tab ────────────────────────────────────────────────────── */}
      <TabsContent value="weeks">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Event weeks</CardTitle>
            {!weekAdding && !weekEditing && (
              <Button size="sm" onClick={startAddWeek}>Add week</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {weeks.length === 0 && !weekAdding && (
              <p className="text-sm text-slate-400 text-center py-8">No weeks yet.</p>
            )}

            {weeks.map((week) => (
              weekEditing === week.id ? (
                <WeekForm
                  key={week.id}
                  form={weekForm}
                  onChange={setWeekForm}
                  onSave={saveWeek}
                  onCancel={() => setWeekEditing(null)}
                />
              ) : (
                <div key={week.id} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{week.label}</p>
                    <p className="text-xs text-slate-400">{week.startDate} – {week.endDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                      onClick={() => startEditWeek(week)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                      onClick={() => {
                        if (confirm(`Delete week "${week.label}"?`)) deleteWeek(week.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            ))}

            {weekAdding && (
              <WeekForm
                form={weekForm}
                onChange={setWeekForm}
                onSave={saveWeek}
                onCancel={() => setWeekAdding(false)}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Doc Requirements tab ─────────────────────────────────────────── */}
      <TabsContent value="doc-reqs">
        <div className="space-y-4">
          {boothTypes.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-400">Add booth types first to configure document requirements.</p>
              </CardContent>
            </Card>
          ) : (
            boothTypes.map((bt) => {
              const btReqs = docReqs.filter((dr) => dr.boothTypeId === bt.id)
              return (
                <Card key={bt.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{bt.name}</CardTitle>
                      {docReqAdding !== bt.id && (
                        <button
                          className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                          onClick={() => startAddDocReq(bt.id)}
                        >
                          + Add requirement
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {btReqs.length === 0 && docReqAdding !== bt.id && (
                      <p className="text-xs text-slate-400">No document requirements for this booth type.</p>
                    )}
                    {btReqs.map((dr) => (
                      <div key={dr.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${dr.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {dr.required ? 'Required' : 'Optional'}
                          </span>
                          <p className="text-sm text-slate-700">{DOC_TYPE_LABELS[dr.docType] ?? dr.docType}</p>
                          {dr.notes && <p className="text-xs text-slate-400">— {dr.notes}</p>}
                        </div>
                        <button
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          onClick={() => deleteDocReq(dr.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {docReqAdding === bt.id && (
                      <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Document type</Label>
                            <select
                              value={docReqForm.docType}
                              onChange={(e) => setDocReqForm((f) => ({ ...f, docType: e.target.value }))}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {ALL_DOC_TYPES.map((dt) => (
                                <option key={dt} value={dt}>{DOC_TYPE_LABELS[dt]}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes (optional)</Label>
                            <Input
                              value={docReqForm.notes}
                              onChange={(e) => setDocReqForm((f) => ({ ...f, notes: e.target.value }))}
                              className="h-8 text-xs"
                              placeholder="e.g. must be current"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${bt.id}`}
                            checked={docReqForm.required}
                            onChange={(e) => setDocReqForm((f) => ({ ...f, required: e.target.checked }))}
                            className="rounded border-slate-300"
                          />
                          <label htmlFor={`required-${bt.id}`} className="text-xs text-slate-700">Required</label>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="text-xs text-slate-500 px-2 py-1"
                            onClick={() => setDocReqAdding(null)}
                          >
                            Cancel
                          </button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => saveDocReq(bt.id)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

// ── WeekForm sub-component ─────────────────────────────────────────────────

type WeekFormState = { label: string; startDate: string; endDate: string; sortOrder: string }

function WeekForm({
  form,
  onChange,
  onSave,
  onCancel,
}: {
  form: WeekFormState
  onChange: (f: WeekFormState) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Label <span className="text-red-500">*</span></Label>
          <Input
            value={form.label}
            onChange={(e) => onChange({ ...form, label: e.target.value })}
            placeholder="Week 1 / June 14–20"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Start date <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => onChange({ ...form, startDate: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End date <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => onChange({ ...form, endDate: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button className="text-xs text-slate-500 px-2 py-1" onClick={onCancel}>Cancel</button>
        <Button size="sm" className="h-7 text-xs" onClick={onSave}>Save</Button>
      </div>
    </div>
  )
}
