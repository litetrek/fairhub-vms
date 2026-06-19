import { NextResponse } from 'next/server'
import { requireStaffOrAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authError = await requireStaffOrAdmin()
  if (authError) return authError

  const vendors = await prisma.vendorProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { businessName: 'asc' },
  })

  return NextResponse.json(vendors)
}
