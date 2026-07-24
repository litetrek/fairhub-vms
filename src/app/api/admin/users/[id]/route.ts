import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase/server'
import { hardDeleteUser } from '@/lib/admin/hard-delete-user'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await hardDeleteUser(id, user.id)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ success: true, email: result.email })
}
