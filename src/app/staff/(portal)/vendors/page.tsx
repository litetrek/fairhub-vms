import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import VendorDirectoryClient from './VendorDirectoryClient'

export default async function StaffVendorDirectoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendors = await prisma.vendorProfile.findMany({
    include: {
      user: { select: { email: true, phone: true, createdAt: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { businessName: 'asc' },
  })

  const vendorList = vendors.map((v) => ({
    id: v.id,
    businessName: v.businessName,
    contactName: v.contactName,
    phone: v.user.phone ?? '',
    businessType: v.businessType ?? '',
    logoUrl: v.logoUrl ?? null,
    applicationCount: v._count.applications,
    memberSince: v.user.createdAt.toISOString(),
  }))

  return <VendorDirectoryClient vendors={vendorList} />
}
