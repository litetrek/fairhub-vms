import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function requireStaffOrAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!dbUser || dbUser.role === 'VENDOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!dbUser || dbUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}
