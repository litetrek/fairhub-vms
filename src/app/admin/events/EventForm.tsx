'use client'

import { useState } from 'react'
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
  eventDateStart: string
  eventDateEnd: string
  hours: string | null
  location: string | null
  address: string | null
  city: string | null
  state: string | null
  mapEmbedUrl: string | null
  bannerImageUrl: string | null
  maxVendors: number | null
  applicationDeadline: string | null
  status: string
  publicSlug: string | null
}

type Props = {
  initialData?: InitialData
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATUS_OPTIONS = ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']

export default function EventForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [eventDateStart, setEventDateStart] = useState(initialData?.eventDateStart ?? '')
  const [eventDateEnd, setEventDateEnd] = useState(initialData?.eventDateEnd ?? '')
  const [hours, setHours] = useState(initialData?.hours ?? '')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [city, setCity] = useState(initialData?.city ?? '')
  const [state, setState] = useState(initialData?.state ?? '')
  const [mapEmbedUrl, setMapEmbedUrl] = useState(initialData?.mapEmbedUrl ?? '')
  const [bannerImageUrl, setBannerImageUrl] = useState(initialData?.bannerImageUrl ?? '')
  const [maxVendors, setMaxVendors] = useState(initialData?.maxVendors?.toString() ?? '')
  const [applicationDeadline, setApplicationDeadline] = useState(initialData?.applicationDeadline ?? '')
  const [status, setStatus] = useState(initialData?.status ?? 'DRAFT')
  const [publicSlug, setPublicSlug] = useState(initialData?.publicSlug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.publicSlug)

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited) {
      setPublicSlug(slugify(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name, description, eventDateStart, eventDateEnd,
        hours, location, address, city, state, mapEmbedUrl,
        bannerImageUrl, maxVendors: maxVendors || null,
        applicationDeadline: applicationDeadline || null,
        status, publicSlug: publicSlug || null,
      }

      const url = isEdit ? `/api/admin/events/${initialData!.id}` : '/api/admin/events'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      toast.success(isEdit ? 'Event updated' : 'Event created')
      router.push('/admin/events')
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!publicSlug) {
      toast.error('Set a public slug before publishing')
      return
    }
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/events/${initialData!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN', publicSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish')
      toast.success('Event published')
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-900">
            {isEdit ? 'Edit event' : 'New event'}
          </h1>
          {isEdit && (
            <p className="text-sm text-slate-500 mt-0.5">{initialData!.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEdit && initialData!.status !== 'OPEN' && (
            <Button
              type="button"
              variant="outline"
              disabled={publishing}
              onClick={handlePublish}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              {publishing ? 'Publishing…' : 'Publish event'}
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Basic info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Event name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Summer Fair 2026"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell vendors about this event…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventDateStart">Start date <span className="text-red-500">*</span></Label>
              <Input
                id="eventDateStart"
                type="date"
                value={eventDateStart}
                onChange={(e) => setEventDateStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventDateEnd">End date <span className="text-red-500">*</span></Label>
              <Input
                id="eventDateEnd"
                type="date"
                value={eventDateEnd}
                onChange={(e) => setEventDateEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="10am–6pm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicationDeadline">Application deadline</Label>
              <Input
                id="applicationDeadline"
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxVendors">Max vendors</Label>
              <Input
                id="maxVendors"
                type="number"
                min={1}
                value={maxVendors}
                onChange={(e) => setMaxVendors(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Venue name</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Main Street Park"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Springfield"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CA"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mapEmbedUrl">Google Maps embed URL</Label>
            <Input
              id="mapEmbedUrl"
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-slate-400">
              Paste the src URL from the Google Maps embed code (Share → Embed a map → copy the src attribute).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Public page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bannerImageUrl">Banner image URL</Label>
            <Input
              id="bannerImageUrl"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="publicSlug">
              Public URL slug{' '}
              <span className="text-xs text-slate-400 font-normal">(lowercase, numbers, hyphens only)</span>
            </Label>
            <Input
              id="publicSlug"
              value={publicSlug}
              onChange={(e) => {
                setPublicSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              placeholder="summer-fair-2026"
              pattern="[a-z0-9-]*"
            />
            {publicSlug && (
              <p className="text-xs text-slate-500">
                Public URL:{' '}
                <span className="font-mono">vendor.cyber-tech.com/fair/{publicSlug}</span>
                {' '}
                <a
                  href={`/fair/${publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Preview
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
