import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AddOnForm from '../AddOnForm'

export default async function NewAddOnPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const boothTypes = await prisma.boothType.findMany({
    where: { eventId },
    select: { id: true, name: true },
    orderBy: { sortOrder: 'asc' },
  })

  return <AddOnForm eventId={eventId} boothTypes={boothTypes} />
}
