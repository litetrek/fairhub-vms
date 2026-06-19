import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.app_metadata?.provider === 'google') {
    return NextResponse.json(
      { error: 'Password change is not available for Google sign-in accounts' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInError) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
