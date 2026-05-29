import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (existingUser) {
      return NextResponse.json({ success: true, existing: true })
    }

    await prisma.user.create({
      data: {
        id: userId,
        email,
        phone: phone || null,
        role: 'VENDOR',
        vendorProfile: {
          create: {
            businessName,
            contactName,
            businessType: '',
          },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
