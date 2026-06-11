import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guards'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ wkId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { wkId } = await params

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if ('label' in body) data.label = body.label
    if ('startDate' in body) data.startDate = new Date(body.startDate)
    if ('endDate' in body) data.endDate = new Date(body.endDate)
    if ('sortOrder' in body) data.sortOrder = Number(body.sortOrder)

    const week = await prisma.eventWeek.update({ where: { id: wkId }, data })
    return NextResponse.json(week)
  } catch {
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ wkId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { wkId } = await params

  const inUse = await prisma.applicationWeek.findFirst({ where: { eventWeekId: wkId }, select: { id: true } })
  if (inUse) {
    return NextResponse.json({ error: 'Cannot delete: one or more applications have selected this week' }, { status: 409 })
  }

  await prisma.eventWeek.delete({ where: { id: wkId } })
  return NextResponse.json({ success: true })
}
