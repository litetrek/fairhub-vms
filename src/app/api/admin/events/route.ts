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

export async function GET() {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      name, description, eventDateStart, eventDateEnd,
      hours, location, address, city, state, mapEmbedUrl,
      bannerImageUrl, maxVendors, applicationDeadline,
      status = 'DRAFT', publicSlug,
    } = body

    if (!name || !eventDateStart || !eventDateEnd) {
      return NextResponse.json({ error: 'name, eventDateStart, and eventDateEnd are required' }, { status: 400 })
    }
    if (new Date(eventDateEnd) < new Date(eventDateStart)) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
    }
    if (publicSlug && !/^[a-z0-9-]+$/.test(publicSlug)) {
      return NextResponse.json({ error: 'Slug may only contain lowercase letters, numbers, and hyphens' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        eventDateStart: new Date(eventDateStart),
        eventDateEnd: new Date(eventDateEnd),
        hours: hours || null,
        location: location || null,
        address: address || null,
        city: city || null,
        state: state || null,
        mapEmbedUrl: mapEmbedUrl || null,
        bannerImageUrl: bannerImageUrl || null,
        maxVendors: maxVendors ? Number(maxVendors) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status,
        publicSlug: publicSlug || null,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Unique constraint')) return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
