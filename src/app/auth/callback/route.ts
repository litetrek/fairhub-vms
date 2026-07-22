import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureVendorUser } from '@/lib/auth/ensure-vendor-user'
import { logVendorActivity, getIpFromRequest } from '@/lib/vendor-activity'
import { resolvePostLoginPath } from '@/lib/auth-redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const payment = searchParams.get('payment')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Password recovery: land on reset form before portal routing
      if (next === '/auth/reset-password') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      await ensureVendorUser({
        userId: data.user.id,
        email: data.user.email!,
        userMetadata: data.user.user_metadata,
        emailConfirmed: !!data.user.email_confirmed_at,
      })

      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { id: true, phone: true },
      })

      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: data.user.id },
        select: { id: true },
      })

      if (vendorProfile) {
        await logVendorActivity({
          vendorId: vendorProfile.id,
          action: 'LOGIN',
          applicationId: null,
          detail: `Provider: ${data.user.app_metadata?.provider ?? 'email'}`,
          ipAddress: getIpFromRequest(request),
        })
      }

      const result = await resolvePostLoginPath(data.user.id, {
        redirect: next,
        payment,
      })

      if ('error' in result) {
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }

      return NextResponse.redirect(`${origin}${result.path}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
