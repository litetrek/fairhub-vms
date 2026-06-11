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
  const weeks = await prisma.eventWeek.findMany({
    where: { eventId: id },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(weeks)
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
    const { label, startDate, endDate, sortOrder = 0 } = body

    if (!label || !startDate || !endDate) {
      return NextResponse.json({ error: 'label, startDate, and endDate are required' }, { status: 400 })
    }

    const week = await prisma.eventWeek.create({
      data: {
        eventId,
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        sortOrder: Number(sortOrder),
      },
    })
    return NextResponse.json(week, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create week' }, { status: 500 })
  }
}
