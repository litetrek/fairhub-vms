import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import EventForm from '../../EventForm'

export default async function EditEventPage({
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

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) notFound()

  const initialData = {
    id: event.id,
    name: event.name,
    description: event.description,
    eventDateStart: event.eventDateStart.toISOString().split('T')[0],
    eventDateEnd: event.eventDateEnd.toISOString().split('T')[0],
    hours: event.hours,
    location: event.location,
    address: event.address,
    city: event.city,
    state: event.state,
    mapEmbedUrl: event.mapEmbedUrl,
    bannerImageUrl: event.bannerImageUrl,
    maxVendors: event.maxVendors,
    applicationDeadline: event.applicationDeadline
      ? event.applicationDeadline.toISOString().split('T')[0]
      : null,
    status: event.status,
    publicSlug: event.publicSlug,
  }

  return <EventForm initialData={initialData} />
}
