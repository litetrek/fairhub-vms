import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  })

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { businessName: true, contactName: true },
  })
  if (!profile) redirect('/auth/login')

  // Check all three places Supabase may record the Google provider
  const identityProviders = (user.identities ?? []).map((id) => id.provider)
  const metaProviders = (user.app_metadata?.providers as string[] | undefined) ?? []
  const isGoogleUser =
    identityProviders.includes('google') ||
    metaProviders.includes('google') ||
    user.app_metadata?.provider === 'google'

  return (
    <ProfileClient
      initialBusinessName={profile.businessName}
      initialContactName={profile.contactName}
      initialPhone={dbUser?.phone ?? ''}
      email={user.email ?? ''}
      isGoogleUser={isGoogleUser}
    />
  )
}
