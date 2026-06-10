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
  { params }: { params: Promise<{ btId: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { btId } = await params

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if ('name' in body) data.name = body.name
    if ('description' in body) data.description = body.description || null
    if ('whatsIncluded' in body) data.whatsIncluded = body.whatsIncluded || null
    if ('basePrice' in body) data.basePrice = Number(body.basePrice)
    if ('sizeSqft' in body) data.sizeSqft = body.sizeSqft ? Number(body.sizeSqft) : null
    if ('totalCount' in body) data.totalCount = Number(body.totalCount)
    if ('sortOrder' in body) data.sortOrder = Number(body.sortOrder)

    const boothType = await prisma.boothType.update({ where: { id: btId }, data })
    return NextResponse.json(boothType)
  } catch {
    return NextResponse.json({ error: 'Failed to update booth type' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ btId: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { btId } = await params

  const inUse = await prisma.application.findFirst({ where: { boothTypeId: btId }, select: { id: true } })
  if (inUse) {
    return NextResponse.json({ error: 'Cannot delete: one or more applications reference this booth type' }, { status: 409 })
  }

  await prisma.boothType.delete({ where: { id: btId } })
  return NextResponse.json({ success: true })
}
