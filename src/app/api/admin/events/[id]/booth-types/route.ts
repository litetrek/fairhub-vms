import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guards'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

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
  const authError = await requireAdmin()
  if (authError) return authError

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
