import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guards'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ aoId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { aoId } = await params

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if ('name' in body) data.name = body.name
    if ('description' in body) data.description = body.description || null
    if ('price' in body) data.price = Number(body.price)
    if ('boothTypeId' in body) data.boothTypeId = body.boothTypeId || null
    if ('sortOrder' in body) data.sortOrder = Number(body.sortOrder)

    const addOn = await prisma.eventAddOn.update({ where: { id: aoId }, data })
    return NextResponse.json(addOn)
  } catch {
    return NextResponse.json({ error: 'Failed to update add-on' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ aoId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { aoId } = await params

  const inUse = await prisma.applicationAddOn.findFirst({ where: { eventAddOnId: aoId }, select: { id: true } })
  if (inUse) {
    return NextResponse.json({ error: 'Cannot delete: one or more applications have selected this add-on' }, { status: 409 })
  }

  await prisma.eventAddOn.delete({ where: { id: aoId } })
  return NextResponse.json({ success: true })
}
