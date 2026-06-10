import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ApplicationWizard from './ApplicationWizard'

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/vendor/profile/complete')

  const { eventId } = await searchParams

  const include = {
    weeks: { orderBy: { sortOrder: 'asc' as const } },
    boothTypes: {
      orderBy: { sortOrder: 'asc' as const },
      include: { docRequirements: true },
    },
  }

  // If a specific event was requested (e.g. from /fair/[slug] CTA), prefer it.
  // Fall back to the first open event if the requested one isn't found or isn't open.
  const event = eventId
    ? (await prisma.event.findFirst({ where: { id: eventId, status: 'OPEN' }, include })) ??
      (await prisma.event.findFirst({ where: { status: 'OPEN' }, include }))
    : await prisma.event.findFirst({ where: { status: 'OPEN' }, include })

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground text-sm">
          No events are open for applications right now.
        </p>
      </div>
    )
  }

  // Serialize for client component (Decimal → number, Date → string)
  const serializedEvent = {
    id: event.id,
    name: event.name,
    description: event.description,
    eventDateStart: event.eventDateStart.toISOString(),
    eventDateEnd: event.eventDateEnd.toISOString(),
    hours: event.hours,
    address: event.address,
    city: event.city,
    state: event.state,
    weeks: event.weeks.map((w) => ({
      id: w.id,
      label: w.label,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate.toISOString(),
      sortOrder: w.sortOrder,
    })),
    boothTypes: event.boothTypes.map((bt) => ({
      id: bt.id,
      name: bt.name,
      description: bt.description,
      basePrice: Number(bt.basePrice),
      sizeSqft: bt.sizeSqft,
      totalCount: bt.totalCount,
      sortOrder: bt.sortOrder,
      docRequirements: bt.docRequirements.map((dr) => ({
        docType: dr.docType,
        required: dr.required,
        notes: dr.notes,
      })),
    })),
  }

  return (
    <ApplicationWizard
      event={serializedEvent}
      vendorProfileId={vendorProfile.id}
    />
  )
}
