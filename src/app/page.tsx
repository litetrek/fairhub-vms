import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const role = user.user_metadata?.role || 'VENDOR'
      if (role === 'VENDOR') {
        redirect('/vendor/dashboard')
      } else {
        redirect('/staff/queue')
      }
    }
  } catch {
    // Supabase not configured yet — fall through to login redirect
  }

  redirect('/auth/login')
}
