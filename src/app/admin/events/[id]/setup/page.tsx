import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import SetupHub from './SetupHub'

export default async function EventSetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      boothTypes: {
        orderBy: { sortOrder: 'asc' },
        include: { docRequirements: true },
      },
      addOns: {
        orderBy: { sortOrder: 'asc' },
        include: { boothType: { select: { name: true } } },
      },
      weeks: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!event) notFound()

  const boothTypes = event.boothTypes.map((bt) => ({
    id: bt.id,
    name: bt.name,
    description: bt.description,
    whatsIncluded: bt.whatsIncluded,
    basePrice: Number(bt.basePrice),
    sizeSqft: bt.sizeSqft,
    totalCount: bt.totalCount,
    sortOrder: bt.sortOrder,
    docRequirements: bt.docRequirements.map((dr) => ({
      id: dr.id,
      boothTypeId: dr.boothTypeId,
      docType: dr.docType,
      required: dr.required,
      notes: dr.notes,
    })),
  }))

  const addOns = event.addOns.map((ao) => ({
    id: ao.id,
    name: ao.name,
    description: ao.description,
    price: Number(ao.price),
    boothTypeId: ao.boothTypeId,
    boothTypeName: ao.boothType?.name ?? null,
    sortOrder: ao.sortOrder,
  }))

  const weeks = event.weeks.map((w) => ({
    id: w.id,
    label: w.label,
    startDate: w.startDate.toISOString().split('T')[0],
    endDate: w.endDate.toISOString().split('T')[0],
    sortOrder: w.sortOrder,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
              <Link href="/admin/events">← Events</Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-slate-900">{event.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Event setup</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/events/${id}/edit`}>Edit details</Link>
        </Button>
      </div>

      <SetupHub
        eventId={id}
        boothTypes={boothTypes}
        addOns={addOns}
        weeks={weeks}
      />
    </div>
  )
}
