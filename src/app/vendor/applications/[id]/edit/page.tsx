import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import EditApplicationForm from './EditApplicationForm'

export default async function EditApplicationPage({
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

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/auth/login')

  const application = await prisma.application.findFirst({
    where: { id, vendorId: vendorProfile.id },
    include: {
      event: {
        include: {
          weeks: { orderBy: { sortOrder: 'asc' } },
          boothTypes: {
            include: { docRequirements: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      boothType: true,
      weeks: { include: { eventWeek: true }, orderBy: { eventWeek: { sortOrder: 'asc' } } },
      documents: true,
    },
  })

  if (!application) notFound()

  if (application.status !== 'REJECTED' && application.status !== 'DRAFT') {
    redirect('/vendor/dashboard')
  }

  const eventWeeks = application.event.weeks.map((w) => ({
    id: w.id,
    label: w.label,
    startDate: w.startDate.toISOString(),
    endDate: w.endDate.toISOString(),
  }))

  const boothTypes = application.event.boothTypes.map((bt) => ({
    id: bt.id,
    name: bt.name,
    description: bt.description,
    basePrice: Number(bt.basePrice),
    sizeSqft: bt.sizeSqft,
    docRequirements: bt.docRequirements.map((dr) => ({
      docType: dr.docType,
      required: dr.required,
    })),
  }))

  const initialWeekIds = application.weeks.map((w) => w.eventWeekId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground">Edit application</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{application.event.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/vendor/dashboard">Cancel</Link>
        </Button>
      </div>

      {application.rejectionNote && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-1">Changes requested</p>
          <p className="text-sm text-destructive/80">{application.rejectionNote}</p>
        </div>
      )}

      <EditApplicationForm
        applicationId={application.id}
        vendorProfileId={vendorProfile.id}
        eventWeeks={eventWeeks}
        boothTypes={boothTypes}
        initialWeekIds={initialWeekIds}
        initialBoothTypeId={application.boothTypeId}
        existingDocs={application.documents.map((d) => ({
          id: d.id,
          docType: d.docType,
          fileName: d.fileName,
        }))}
      />
    </div>
  )
}
