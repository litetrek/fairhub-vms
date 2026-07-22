import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolvePostLoginPath } from '@/lib/auth-redirect'
import { ensureVendorUser } from '@/lib/auth/ensure-vendor-user'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureVendorUser({
    userId: user.id,
    email: user.email!,
    userMetadata: user.user_metadata,
    emailConfirmed: !!user.email_confirmed_at,
  })

  const { searchParams } = new URL(request.url)
  const result = await resolvePostLoginPath(user.id, {
    redirect: searchParams.get('redirect'),
    payment: searchParams.get('payment'),
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({ path: result.path, role: result.role })
}
