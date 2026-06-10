'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewBoothTypePage() {
  const router = useRouter()
  const { id: eventId } = useParams<{ id: string }>()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [whatsIncluded, setWhatsIncluded] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [sizeSqft, setSizeSqft] = useState('')
  const [totalCount, setTotalCount] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/booth-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, whatsIncluded, basePrice, sizeSqft, totalCount, sortOrder }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create')
      toast.success('Booth type created')
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
          <h1 className="text-xl font-medium text-slate-900">New booth type</h1>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create booth type'}
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Booth type details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Food Vendor" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description of this booth type…" />
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
            <p className="text-xs text-slate-400">Shown to vendors on the public event page.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="basePrice">Base price ($) <span className="text-red-500">*</span></Label>
              <Input id="basePrice" type="number" min={0} step={0.01} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required placeholder="250.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizeSqft">Size (sqft)</Label>
              <Input id="sizeSqft" type="number" min={1} value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} placeholder="100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="totalCount">Total booths <span className="text-red-500">*</span></Label>
              <Input id="totalCount" type="number" min={1} value={totalCount} onChange={(e) => setTotalCount(e.target.value)} required placeholder="20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
