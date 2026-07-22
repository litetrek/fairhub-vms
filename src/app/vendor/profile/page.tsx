import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export default async function VendorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const params = await searchParams
  const isSetup = params.setup === 'true'
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
  })
  if (!profile) redirect('/auth/login')

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
      initialBusinessType={profile.businessType ?? ''}
      initialAddress={profile.address ?? ''}
      initialCity={profile.city ?? ''}
      initialState={profile.state ?? ''}
      initialZip={profile.zip ?? ''}
      initialWebsite={profile.website ?? ''}
      initialDescription={profile.description ?? ''}
      initialLogoUrl={profile.logoUrl ?? null}
      initialBannerImageUrl={profile.bannerImageUrl ?? null}
      initialGalleryImages={profile.galleryImages ?? []}
      initialInstagramUrl={profile.instagramUrl ?? ''}
      initialFacebookUrl={profile.facebookUrl ?? ''}
      initialTiktokUrl={profile.tiktokUrl ?? ''}
      initialYearsInBusiness={profile.yearsInBusiness ?? null}
      initialTaxId={profile.taxId ?? ''}
      email={user.email ?? ''}
      isGoogleUser={isGoogleUser}
      isSetup={isSetup}
    />
  )
}
