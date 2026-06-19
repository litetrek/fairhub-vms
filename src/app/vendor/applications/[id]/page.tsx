import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ApplicationActions from '@/components/vendor/ApplicationActions'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SUBMITTED: 'status-badge-info',
  UNDER_REVIEW: 'status-badge-pending',
  CONDITIONALLY_APPROVED: 'status-badge-secondary-state',
  APPROVED: 'status-badge-approved',
  REJECTED: 'status-badge-rejected',
  WITHDRAWN: 'status-badge-draft',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Conditionally approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'status-badge-draft',
  SENT: 'status-badge-info',
  PARTIALLY_PAID: 'status-badge-pending',
  PAID: 'status-badge-approved',
  OVERDUE: 'status-badge-rejected',
  CANCELLED: 'status-badge-draft',
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function VendorApplicationViewPage({
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
      event: true,
      boothType: true,
      weeks: {
        include: { eventWeek: true },
        orderBy: { eventWeek: { sortOrder: 'asc' } },
      },
      documents: true,
      assignment: { include: { booth: true } },
      invoice: {
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  })

  if (!application) notFound()

  // DRAFT and REJECTED go to edit instead; WITHDRAWN shows read-only detail
  if (application.status === 'DRAFT' || application.status === 'REJECTED') {
    redirect(`/vendor/applications/${id}/edit`)
  }

  const documentsWithUrls = await Promise.all(
    application.documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(doc.fileUrl, 3600)
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  const { assignment, invoice } = application
  const booth = assignment?.booth

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
              <Link href="/vendor/applications">← Applications</Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-foreground">Application details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{application.event.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[application.status] ?? 'status-badge-draft'}`}
          >
            {STATUS_LABELS[application.status] ?? application.status}
          </span>
          <ApplicationActions
            applicationId={application.id}
            status={application.status}
            invoiceStatus={invoice?.status ?? null}
          />
        </div>
      </div>

      {/* Application summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Booth type</p>
            <p className="text-foreground">
              {application.boothType?.name ?? '—'}
              {application.boothType?.sizeSqft &&
                ` (${application.boothType.sizeSqft} sqft)`}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground">
              Weeks ({application.weeks.length})
            </p>
            {application.weeks.length > 0 ? (
              application.weeks.map((w) => (
                <p key={w.id} className="text-foreground">{w.eventWeek.label}</p>
              ))
            ) : (
              <p className="text-muted-foreground">None selected</p>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="text-foreground">{formatDate(application.submittedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Assigned booth */}
      {booth && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your booth</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <div>
              <p className="text-xs text-muted-foreground">Booth number</p>
              <p className="text-foreground font-medium">{booth.boothNumber}</p>
            </div>
            {booth.zone && (
              <div>
                <p className="text-xs text-muted-foreground">Zone</p>
                <p className="text-foreground">{booth.zone}</p>
              </div>
            )}
            {booth.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-foreground">{booth.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice summary */}
      {invoice && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Invoice</CardTitle>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[invoice.status] ?? 'status-badge-draft'}`}
              >
                {invoice.status.toLowerCase().replace(/_/g, ' ')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="divide-y divide-border">
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="py-2 flex justify-between">
                  <p className="text-foreground">{item.description}</p>
                  <p className="text-foreground">${Number(item.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-1 border-t border-border">
              <p className="font-medium text-foreground">Total</p>
              <p className="font-medium text-foreground">
                ${Number(invoice.total).toFixed(2)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/vendor/invoices/${invoice.id}`}>View full invoice</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Documents ({documentsWithUrls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentsWithUrls.length === 0 ? (
            <p className="text-xs text-muted-foreground">No documents uploaded</p>
          ) : (
            <div className="divide-y divide-border">
              {documentsWithUrls.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">
                      {DOC_LABELS[doc.docType] ?? doc.docType}
                    </p>
                    <a
                      href={doc.signedUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-0.5 block"
                    >
                      {doc.fileName}
                    </a>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === 'VERIFIED'
                        ? 'status-badge-approved'
                        : doc.status === 'REJECTED'
                          ? 'status-badge-rejected'
                          : 'status-badge-draft'
                    }`}
                  >
                    {doc.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
