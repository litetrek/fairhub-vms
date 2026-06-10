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
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
