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
  const addOns = await prisma.eventAddOn.findMany({
    where: { eventId: id },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(addOns)
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
    const { name, description, price, boothTypeId, sortOrder = 0 } = body

    if (!name || price == null) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
    }

    const addOn = await prisma.eventAddOn.create({
      data: {
        eventId,
        name,
        description: description || null,
        price: Number(price),
        boothTypeId: boothTypeId || null,
        sortOrder: Number(sortOrder),
      },
    })
    return NextResponse.json(addOn, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create add-on' }, { status: 500 })
  }
}
