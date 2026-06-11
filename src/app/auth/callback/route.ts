import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const payment = searchParams.get('payment')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const role = data.user.user_metadata?.role || 'VENDOR'

      if (role !== 'VENDOR') {
        return NextResponse.redirect(`${origin}/staff/queue`)
      }

      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: data.user.id },
      })

      // Post-Stripe redirect: send vendor straight to their invoice page
      if (next?.startsWith('/vendor/') && vendorProfile) {
        const dest = payment ? `${origin}${next}?payment=${payment}` : `${origin}${next}`
        return NextResponse.redirect(dest)
      }

      const redirectTo = vendorProfile ? '/vendor/dashboard' : '/vendor/profile/complete'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
