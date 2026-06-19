import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, phone: true },
  })
  if (!dbUser || dbUser.role !== 'VENDOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { businessName: true, contactName: true },
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({
    businessName: profile.businessName,
    contactName: profile.contactName,
    phone: dbUser.phone ?? '',
    email: user.email,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (!dbUser || dbUser.role !== 'VENDOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { businessName, contactName, phone } = body

  if (businessName !== undefined && (typeof businessName !== 'string' || !businessName.trim())) {
    return NextResponse.json({ error: 'Business name must be a non-empty string' }, { status: 400 })
  }
  if (contactName !== undefined && (typeof contactName !== 'string' || !contactName.trim())) {
    return NextResponse.json({ error: 'Contact name must be a non-empty string' }, { status: 400 })
  }
  if (phone !== undefined && (typeof phone !== 'string' || !phone.trim())) {
    return NextResponse.json({ error: 'Phone must be a non-empty string' }, { status: 400 })
  }

  const profileData: Record<string, string> = {}
  if (businessName) profileData.businessName = businessName.trim()
  if (contactName) profileData.contactName = contactName.trim()

  const [updatedProfile] = await Promise.all([
    Object.keys(profileData).length > 0
      ? prisma.vendorProfile.update({ where: { userId: user.id }, data: profileData })
      : prisma.vendorProfile.findUnique({ where: { userId: user.id } }),
    phone !== undefined
      ? prisma.user.update({ where: { id: user.id }, data: { phone: phone.trim() } })
      : Promise.resolve(),
  ])

  return NextResponse.json({
    businessName: updatedProfile?.businessName,
    contactName: updatedProfile?.contactName,
  })
}
