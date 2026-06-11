import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const VALID_ROLES = ['VENDOR', 'STAFF', 'ADMIN'] as const
type Role = (typeof VALID_ROLES)[number]

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ users, currentUserId: user!.id })
}

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { email, password, role } = body as {
    email?: string
    password?: string
    role?: string
  }

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: 'email, password, and role are required.' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    )
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Role must be one of: ${VALID_ROLES.join(', ')}.` },
      { status: 400 }
    )
  }

  const { data: authData, error: authError2 } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError2 || !authData.user) {
    return NextResponse.json(
      { error: authError2?.message ?? 'Failed to create auth user.' },
      { status: 422 }
    )
  }

  const newUser = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      role: role as Role,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(newUser, { status: 201 })
}
