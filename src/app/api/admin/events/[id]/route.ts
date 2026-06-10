import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function requireStaffOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!dbUser || dbUser.role === 'VENDOR') return null
  return user
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()

    if (body.eventDateStart && body.eventDateEnd) {
      if (new Date(body.eventDateEnd) < new Date(body.eventDateStart)) {
        return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
      }
    }
    if (body.publicSlug != null && body.publicSlug !== '' && !/^[a-z0-9-]+$/.test(body.publicSlug)) {
      return NextResponse.json({ error: 'Slug may only contain lowercase letters, numbers, and hyphens' }, { status: 400 })
    }
    if (body.status === 'OPEN') {
      const existing = await prisma.event.findUnique({ where: { id }, select: { publicSlug: true } })
      const slug = body.publicSlug ?? existing?.publicSlug
      if (!slug) return NextResponse.json({ error: 'A public slug is required before publishing' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if ('name' in body) data.name = body.name
    if ('description' in body) data.description = body.description || null
    if ('hours' in body) data.hours = body.hours || null
    if ('location' in body) data.location = body.location || null
    if ('address' in body) data.address = body.address || null
    if ('city' in body) data.city = body.city || null
    if ('state' in body) data.state = body.state || null
    if ('mapEmbedUrl' in body) data.mapEmbedUrl = body.mapEmbedUrl || null
    if ('bannerImageUrl' in body) data.bannerImageUrl = body.bannerImageUrl || null
    if ('status' in body) data.status = body.status
    if ('publicSlug' in body) data.publicSlug = body.publicSlug || null
    if ('maxVendors' in body) data.maxVendors = body.maxVendors ? Number(body.maxVendors) : null
    if ('eventDateStart' in body) data.eventDateStart = new Date(body.eventDateStart)
    if ('eventDateEnd' in body) data.eventDateEnd = new Date(body.eventDateEnd)
    if ('applicationDeadline' in body) data.applicationDeadline = body.applicationDeadline ? new Date(body.applicationDeadline) : null

    const event = await prisma.event.update({ where: { id }, data })
    return NextResponse.json(event)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Unique constraint')) return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
