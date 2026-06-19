import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ProfileCompleteForm from './ProfileCompleteForm'

export default async function ProfileCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const isSetup = params.setup === 'true'

  const existingProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: {
      businessName: true,
      contactName: true,
      businessType: true,
      description: true,
      website: true,
      instagramUrl: true,
      facebookUrl: true,
      yearsInBusiness: true,
    },
  })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  })

  const provider = (user.app_metadata?.provider as string) ?? 'email'

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-surface="festive"
    >
      <ProfileCompleteForm
        userId={user.id}
        email={user.email!}
        provider={provider}
        isSetup={isSetup}
        hasProfile={!!existingProfile}
        initialData={{
          businessName: existingProfile?.businessName ?? '',
          contactName: existingProfile?.contactName ?? '',
          phone: dbUser?.phone ?? '',
          businessType: existingProfile?.businessType ?? '',
          yearsInBusiness: existingProfile?.yearsInBusiness ?? null,
          description: existingProfile?.description ?? '',
          website: existingProfile?.website ?? '',
          instagramUrl: existingProfile?.instagramUrl ?? '',
          facebookUrl: existingProfile?.facebookUrl ?? '',
        }}
      />
    </div>
  )
}
