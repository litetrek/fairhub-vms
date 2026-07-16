'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logVendorActivity } from '@/lib/vendor-activity'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Read role from the User table — metadata may be absent for staff accounts.
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  })
  const role = dbUser?.role ?? 'VENDOR'

  if (role === 'VENDOR') {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: data.user.id },
      select: { id: true },
    })
    if (vendorProfile) {
      await logVendorActivity({
        vendorId: vendorProfile.id,
        action: 'LOGIN',
        detail: 'Provider: email',
      })
    }
  }

  revalidatePath('/', 'layout')

  if (role === 'VENDOR') {
    redirect('/vendor/dashboard')
  } else {
    redirect('/staff/queue')
  }
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string
  const contactName = formData.get('contactName') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'VENDOR',
        businessName,
        contactName,
        phone,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && data.session) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          phone: phone || null,
          role: 'VENDOR',
          emailVerified: true,
          vendorProfile: {
            create: {
              businessName,
              contactName,
              businessType: '',
            },
          },
        },
      })
    } catch (dbError) {
      console.error('Database error creating user:', dbError)
    }
    redirect('/vendor/profile/complete?setup=true')
  }

  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
