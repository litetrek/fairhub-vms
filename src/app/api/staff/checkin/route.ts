import { NextResponse } from 'next/server'
import { requireStaffOrAdmin } from '@/lib/guards'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const authError = await requireStaffOrAdmin()
  if (authError) return authError

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const body = await request.json().catch(() => null)
  if (!body?.assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
  }

  const { assignmentId } = body as { assignmentId: string }

  const assignment = await prisma.boothAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      booth: { select: { boothNumber: true, zone: true } },
      application: {
        include: { vendor: { select: { businessName: true, contactName: true } } },
      },
    },
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (assignment.checkedIn) {
    return NextResponse.json(assignment)
  }

  const updated = await prisma.boothAssignment.update({
    where: { id: assignmentId },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInById: user!.id,
    },
    include: {
      booth: { select: { boothNumber: true, zone: true } },
      application: {
        include: { vendor: { select: { businessName: true, contactName: true } } },
      },
    },
  })

  return NextResponse.json(updated)
}
