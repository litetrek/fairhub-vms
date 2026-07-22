import { prisma } from '@/lib/prisma'

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

/**
 * Resolve where an authenticated user should land after login / auth callback.
 * Uses Prisma User.role (not Supabase user_metadata).
 */
export async function resolvePostLoginPath(
  userId: string,
  options?: { redirect?: string | null; payment?: string | null }
): Promise<{ path: string; role: string } | { error: string }> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, phone: true },
  })

  if (!dbUser) {
    return { error: 'Account profile not found. Please contact support.' }
  }

  if (dbUser.role === 'STAFF' || dbUser.role === 'ADMIN') {
    return { path: '/staff/queue', role: dbUser.role }
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      contactName: true,
      description: true,
    },
  })

  const profileWithPhone = vendorProfile
    ? { ...vendorProfile, phone: dbUser.phone }
    : null

  if (!isProfileComplete(profileWithPhone)) {
    return { path: '/vendor/profile/complete?setup=true', role: dbUser.role }
  }

  const redirect = options?.redirect
  if (redirect?.startsWith('/vendor/')) {
    const payment = options?.payment
    const path = payment ? `${redirect}?payment=${payment}` : redirect
    return { path, role: dbUser.role }
  }

  return { path: '/vendor/dashboard', role: dbUser.role }
}
