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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ wkId: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wkId } = await params

  const inUse = await prisma.applicationWeek.findFirst({ where: { eventWeekId: wkId }, select: { id: true } })
  if (inUse) {
    return NextResponse.json({ error: 'Cannot delete: one or more applications have selected this week' }, { status: 409 })
  }

  await prisma.eventWeek.delete({ where: { id: wkId } })
  return NextResponse.json({ success: true })
}
