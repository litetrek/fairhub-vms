import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const VALID_ROLES = ['VENDOR', 'STAFF', 'ADMIN'] as const
type Role = (typeof VALID_ROLES)[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = await createClient()
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  const { id: targetId } = await params

  if (targetId === supabaseUser!.id) {
    return NextResponse.json(
      { error: 'You cannot change your own role.' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { role } = body as { role?: string }

  if (!role || !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `role must be one of: ${VALID_ROLES.join(', ')}.` },
      { status: 400 }
    )
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: role as Role },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(updated)
}
