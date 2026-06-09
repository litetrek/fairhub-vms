import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ProfileCompleteForm from './ProfileCompleteForm'

export default async function ProfileCompletePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })

  if (existing) {
    redirect('/vendor/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <ProfileCompleteForm userId={user.id} email={user.email!} />
    </div>
  )
}
