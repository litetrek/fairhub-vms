import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import BoothTypeEditForm from './BoothTypeEditForm'

export default async function EditBoothTypePage({
  params,
}: {
  params: Promise<{ id: string; btId: string }>
}) {
  const { id: eventId, btId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const bt = await prisma.boothType.findUnique({ where: { id: btId } })
  if (!bt || bt.eventId !== eventId) notFound()

  const initialData = {
    id: bt.id,
    name: bt.name,
    description: bt.description,
    whatsIncluded: bt.whatsIncluded,
    basePrice: Number(bt.basePrice).toString(),
    sizeSqft: bt.sizeSqft?.toString() ?? '',
    totalCount: bt.totalCount.toString(),
    sortOrder: bt.sortOrder.toString(),
  }

  return <BoothTypeEditForm eventId={eventId} initialData={initialData} />
}
