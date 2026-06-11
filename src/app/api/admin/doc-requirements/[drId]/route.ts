import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guards'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ drId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { drId } = await params
  await prisma.boothTypeDocRequirement.delete({ where: { id: drId } })
  return NextResponse.json({ success: true })
}
