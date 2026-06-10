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
  const boothTypes = await prisma.boothType.findMany({
    where: { eventId: id },
    include: { docRequirements: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(boothTypes)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: eventId } = await params

  try {
    const body = await request.json()
    const { name, description, whatsIncluded, basePrice, sizeSqft, totalCount, sortOrder = 0 } = body

    if (!name || basePrice == null || totalCount == null) {
      return NextResponse.json({ error: 'name, basePrice, and totalCount are required' }, { status: 400 })
    }

    const boothType = await prisma.boothType.create({
      data: {
        eventId,
        name,
        description: description || null,
        whatsIncluded: whatsIncluded || null,
        basePrice: Number(basePrice),
        sizeSqft: sizeSqft ? Number(sizeSqft) : null,
        totalCount: Number(totalCount),
        sortOrder: Number(sortOrder),
      },
    })
    return NextResponse.json(boothType, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create booth type' }, { status: 500 })
  }
}
