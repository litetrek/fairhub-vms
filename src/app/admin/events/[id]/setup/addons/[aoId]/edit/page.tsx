import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AddOnForm from '../../AddOnForm'

export default async function EditAddOnPage({
  params,
}: {
  params: Promise<{ id: string; aoId: string }>
}) {
  const { id: eventId, aoId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [addOn, boothTypes] = await Promise.all([
    prisma.eventAddOn.findUnique({ where: { id: aoId } }),
    prisma.boothType.findMany({
      where: { eventId },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  if (!addOn || addOn.eventId !== eventId) notFound()

  const initialData = {
    id: addOn.id,
    name: addOn.name,
    description: addOn.description,
    price: Number(addOn.price).toString(),
    boothTypeId: addOn.boothTypeId,
    sortOrder: addOn.sortOrder.toString(),
  }

  return <AddOnForm eventId={eventId} boothTypes={boothTypes} initialData={initialData} />
}
