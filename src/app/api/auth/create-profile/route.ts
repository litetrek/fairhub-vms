import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureVendorUser } from '@/lib/auth/ensure-vendor-user'

export async function POST(request: Request) {
  try {
    const { userId, email, phone, businessName, contactName } =
      await request.json()

    if (!userId || !email || !businessName || !contactName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await ensureVendorUser({
      userId,
      email,
      userMetadata: { businessName, contactName, phone, role: 'VENDOR' },
      emailConfirmed: true,
    })

    if (result.existing) {
      // Backfill phone if register supplied it and User row predates this call
      if (phone) {
        await prisma.user.updateMany({
          where: { id: userId, phone: null },
          data: { phone },
        })
      }
      return NextResponse.json({ success: true, existing: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
