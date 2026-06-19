import { NextResponse } from 'next/server'
import { requireStaffOrAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireStaffOrAdmin()
  if (authError) return authError

  const { id } = await params

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, createdAt: true } },
      applications: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          event: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(vendor)
}
