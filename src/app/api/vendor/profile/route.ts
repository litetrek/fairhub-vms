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
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({
    businessName: profile.businessName,
    contactName: profile.contactName,
    phone: dbUser.phone ?? '',
    email: user.email,
    businessType: profile.businessType ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    zip: profile.zip ?? '',
    website: profile.website ?? '',
    description: profile.description ?? '',
    logoUrl: profile.logoUrl ?? null,
    bannerImageUrl: profile.bannerImageUrl ?? null,
    instagramUrl: profile.instagramUrl ?? '',
    facebookUrl: profile.facebookUrl ?? '',
    tiktokUrl: profile.tiktokUrl ?? '',
    yearsInBusiness: profile.yearsInBusiness ?? null,
    taxId: profile.taxId ?? '',
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
  const {
    businessName,
    contactName,
    phone,
    businessType,
    address,
    city,
    state,
    zip,
    website,
    description,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    yearsInBusiness,
    taxId,
    logoUrl,
    bannerImageUrl,
    galleryImages,
  } = body

  // Required fields — must be non-empty strings if present
  if (businessName !== undefined && (typeof businessName !== 'string' || !businessName.trim())) {
    return NextResponse.json({ error: 'Business name must be a non-empty string' }, { status: 400 })
  }
  if (contactName !== undefined && (typeof contactName !== 'string' || !contactName.trim())) {
    return NextResponse.json({ error: 'Contact name must be a non-empty string' }, { status: 400 })
  }
  if (phone !== undefined && (typeof phone !== 'string' || !phone.trim())) {
    return NextResponse.json({ error: 'Phone must be a non-empty string' }, { status: 400 })
  }

  // yearsInBusiness must be a non-negative number if provided
  if (
    yearsInBusiness !== undefined &&
    yearsInBusiness !== null &&
    (typeof yearsInBusiness !== 'number' || yearsInBusiness < 0 || yearsInBusiness > 100)
  ) {
    return NextResponse.json({ error: 'Years in business must be a number between 0 and 100' }, { status: 400 })
  }

  // Build profile update object
  const profileData: Record<string, unknown> = { profileUpdatedAt: new Date() }
  if (businessName !== undefined) profileData.businessName = businessName.trim()
  if (contactName !== undefined) profileData.contactName = contactName.trim()
  if (businessType !== undefined) profileData.businessType = businessType?.trim() || null
  if (address !== undefined) profileData.address = address?.trim() || null
  if (city !== undefined) profileData.city = city?.trim() || null
  if (state !== undefined) profileData.state = state?.trim() || null
  if (zip !== undefined) profileData.zip = zip?.trim() || null
  if (website !== undefined) profileData.website = website?.trim() || null
  if (description !== undefined) profileData.description = description?.trim() || null
  if (instagramUrl !== undefined) profileData.instagramUrl = instagramUrl?.trim() || null
  if (facebookUrl !== undefined) profileData.facebookUrl = facebookUrl?.trim() || null
  if (tiktokUrl !== undefined) profileData.tiktokUrl = tiktokUrl?.trim() || null
  if (yearsInBusiness !== undefined) profileData.yearsInBusiness = yearsInBusiness
  if (taxId !== undefined) profileData.taxId = taxId?.trim() || null
  if (logoUrl !== undefined) profileData.logoUrl = logoUrl || null
  if (bannerImageUrl !== undefined) profileData.bannerImageUrl = bannerImageUrl || null
  if (galleryImages !== undefined && Array.isArray(galleryImages)) {
    profileData.galleryImages = galleryImages.filter((u: unknown) => typeof u === 'string' && u.trim())
  }

  const [updatedProfile] = await Promise.all([
    prisma.vendorProfile.update({ where: { userId: user.id }, data: profileData }),
    phone !== undefined
      ? prisma.user.update({ where: { id: user.id }, data: { phone: phone.trim() } })
      : Promise.resolve(),
  ])

  return NextResponse.json(updatedProfile)
}
