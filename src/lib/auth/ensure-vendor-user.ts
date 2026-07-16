import { prisma } from '@/lib/prisma'

type UserMetadata = {
  role?: string
  businessName?: string
  contactName?: string
  phone?: string
  full_name?: string
  name?: string
}

/**
 * Ensures a Prisma User + VendorProfile exist for a Supabase auth user.
 * Idempotent — safe to call from register (immediate session), create-profile API,
 * and auth/callback (post email verification or OAuth).
 */
export async function ensureVendorUser(params: {
  userId: string
  email: string
  userMetadata?: UserMetadata | null
  emailConfirmed?: boolean
}): Promise<{ created: boolean; existing: boolean }> {
  const existing = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, emailVerified: true },
  })

  if (existing) {
    if (params.emailConfirmed && !existing.emailVerified) {
      await prisma.user.update({
        where: { id: params.userId },
        data: { emailVerified: true },
      })
    }
    return { created: false, existing: true }
  }

  const meta = params.userMetadata ?? {}
  const businessName = meta.businessName?.trim() || ''
  const contactName =
    meta.contactName?.trim() ||
    meta.full_name?.trim() ||
    meta.name?.trim() ||
    params.email.split('@')[0] ||
    ''
  const phone = meta.phone?.trim() || null

  await prisma.user.create({
    data: {
      id: params.userId,
      email: params.email,
      phone,
      role: 'VENDOR',
      emailVerified: params.emailConfirmed ?? false,
      vendorProfile: {
        create: {
          businessName,
          contactName,
          businessType: '',
        },
      },
    },
  })

  return { created: true, existing: false }
}
