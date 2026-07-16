import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureVendorUser } from '@/lib/auth/ensure-vendor-user'
import { logVendorActivity, getIpFromRequest } from '@/lib/vendor-activity'

function isProfileComplete(profile: {
  businessName: string
  contactName: string
  phone?: string | null
  description?: string | null
} | null): boolean {
  if (!profile) return false
  return !!(
    profile.businessName?.trim() &&
    profile.contactName?.trim() &&
    profile.phone?.trim() &&
    profile.description?.trim()
  )
}

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
        select: {
          id: true,
          businessName: true,
          contactName: true,
          description: true,
        },
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

      // Post-Stripe redirect: send vendor straight to their invoice page
      if (next?.startsWith('/vendor/') && vendorProfile) {
        const dest = payment ? `${origin}${next}?payment=${payment}` : `${origin}${next}`
        return NextResponse.redirect(dest)
      }

      const profileWithPhone = vendorProfile
        ? { ...vendorProfile, phone: dbUser?.phone }
        : null

      if (!isProfileComplete(profileWithPhone)) {
        return NextResponse.redirect(`${origin}/vendor/profile/complete?setup=true`)
      }

      return NextResponse.redirect(`${origin}/vendor/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
