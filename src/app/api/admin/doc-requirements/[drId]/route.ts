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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ drId: string }> }
) {
  const user = await requireStaffOrAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { drId } = await params
  await prisma.boothTypeDocRequirement.delete({ where: { id: drId } })
  return NextResponse.json({ success: true })
}
