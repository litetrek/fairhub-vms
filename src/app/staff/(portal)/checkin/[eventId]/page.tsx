import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CheckInClient from './CheckInClient'

export default async function CheckInEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [event, assignments] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, eventDateStart: true, eventDateEnd: true },
    }),
    prisma.boothAssignment.findMany({
      where: {
        application: {
          eventId,
          status: 'APPROVED',
        },
      },
      include: {
        booth: { select: { boothNumber: true, zone: true } },
        application: {
          include: {
            vendor: { select: { businessName: true, contactName: true } },
          },
        },
        checkedInBy: { select: { email: true } },
      },
      orderBy: { booth: { boothNumber: 'asc' } },
    }),
  ])

  if (!event) notFound()

  const serialized = assignments.map((a) => ({
    id: a.id,
    checkedIn: a.checkedIn,
    checkedInAt: a.checkedInAt ? a.checkedInAt.toISOString() : null,
    checkedInByEmail: a.checkedInBy?.email ?? null,
    booth: { boothNumber: a.booth.boothNumber, zone: a.booth.zone },
    application: {
      vendor: {
        businessName: a.application.vendor.businessName,
        contactName: a.application.vendor.contactName,
      },
    },
  }))

  return (
    <CheckInClient
      event={{
        id: event.id,
        name: event.name,
        eventDateStart: event.eventDateStart.toISOString(),
        eventDateEnd: event.eventDateEnd.toISOString(),
      }}
      initialAssignments={serialized}
    />
  )
}
