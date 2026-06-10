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

type InitialData = {
  id: string
  name: string
  description: string | null
  whatsIncluded: string | null
  basePrice: string
  sizeSqft: string
  totalCount: string
  sortOrder: string
}

export default function BoothTypeEditForm({ eventId, initialData }: { eventId: string; initialData: InitialData }) {
  const router = useRouter()

  const [name, setName] = useState(initialData.name)
  const [description, setDescription] = useState(initialData.description ?? '')
  const [whatsIncluded, setWhatsIncluded] = useState(initialData.whatsIncluded ?? '')
  const [basePrice, setBasePrice] = useState(initialData.basePrice)
  const [sizeSqft, setSizeSqft] = useState(initialData.sizeSqft)
  const [totalCount, setTotalCount] = useState(initialData.totalCount)
  const [sortOrder, setSortOrder] = useState(initialData.sortOrder)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/booth-types/${initialData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, whatsIncluded, basePrice, sizeSqft, totalCount, sortOrder }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update')
      toast.success('Booth type updated')
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
          <h1 className="text-xl font-medium text-slate-900">Edit booth type</h1>
          <p className="text-sm text-slate-500 mt-0.5">{initialData.name}</p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Booth type details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsIncluded">What&apos;s included</Label>
            <Textarea
              id="whatsIncluded"
              value={whatsIncluded}
              onChange={(e) => setWhatsIncluded(e.target.value)}
              rows={3}
              placeholder="10×10 tent, one 6ft table, two chairs…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="basePrice">Base price ($) <span className="text-red-500">*</span></Label>
              <Input id="basePrice" type="number" min={0} step={0.01} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizeSqft">Size (sqft)</Label>
              <Input id="sizeSqft" type="number" min={1} value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="totalCount">Total booths <span className="text-red-500">*</span></Label>
              <Input id="totalCount" type="number" min={1} value={totalCount} onChange={(e) => setTotalCount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
