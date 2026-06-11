import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guards'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ btId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { btId } = await params
  const reqs = await prisma.boothTypeDocRequirement.findMany({ where: { boothTypeId: btId } })
  return NextResponse.json(reqs)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ btId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { btId } = await params

  try {
    const body = await request.json()
    const { docType, required = true, notes } = body

    if (!docType) {
      return NextResponse.json({ error: 'docType is required' }, { status: 400 })
    }

    const req = await prisma.boothTypeDocRequirement.create({
      data: {
        boothTypeId: btId,
        docType,
        required: Boolean(required),
        notes: notes || null,
      },
    })
    return NextResponse.json(req, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'This document type is already required for this booth type' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create doc requirement' }, { status: 500 })
  }
}
