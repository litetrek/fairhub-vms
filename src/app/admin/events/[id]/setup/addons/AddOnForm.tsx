'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type BoothTypeOption = { id: string; name: string }

type InitialData = {
  id: string
  name: string
  description: string | null
  price: string
  boothTypeId: string | null
  sortOrder: string
}

type Props = {
  eventId: string
  boothTypes: BoothTypeOption[]
  initialData?: InitialData
}

export default function AddOnForm({ eventId, boothTypes, initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [price, setPrice] = useState(initialData?.price ?? '')
  const [boothTypeId, setBoothTypeId] = useState(initialData?.boothTypeId ?? '')
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? '0')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/addons/${initialData!.id}` : `/api/admin/events/${eventId}/addons`
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price, boothTypeId: boothTypeId || null, sortOrder }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      toast.success(isEdit ? 'Add-on updated' : 'Add-on created')
      router.push(`/admin/events/${eventId}/setup`)
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
              <Link href={`/admin/events/${eventId}/setup`}>← Setup</Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-slate-900">
            {isEdit ? 'Edit add-on' : 'New add-on'}
          </h1>
          {isEdit && <p className="text-sm text-slate-500 mt-0.5">{initialData!.name}</p>}
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create add-on'}
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add-on details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Electricity hookup" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ($) <span className="text-red-500">*</span></Label>
              <Input id="price" type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="50.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="boothTypeId">Available for</Label>
            <select
              id="boothTypeId"
              value={boothTypeId}
              onChange={(e) => setBoothTypeId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All booth types</option>
              {boothTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400">Leave as "All booth types" to make this add-on available to everyone.</p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
