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

// ── Status Timeline ──────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  'Submitted',
  'Under Review',
  'Approved',
  'Booth Assigned',
  'Invoice Sent',
  'Paid',
]

function completedCount(
  status: string,
  assignment: { id: string } | null,
  invoice: { id: string; status: string } | null
): number {
  if (status === 'SUBMITTED') return 1
  if (status === 'UNDER_REVIEW' || status === 'CONDITIONALLY_APPROVED') return 2
  if (status === 'REJECTED') return 2
  if (status === 'APPROVED') {
    if (!assignment) return 3
    if (!invoice) return 4
    if (invoice.status === 'PAID') return 6
    return 5
  }
  return 0
}

function StatusTimeline({
  status,
  assignment,
  invoice,
  rejectionNote,
}: {
  status: string
  assignment: { id: string } | null
  invoice: { id: string; status: string } | null
  rejectionNote: string | null
}) {
  if (status === 'WITHDRAWN') {
    return (
      <div className="p-4 rounded-lg border border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">This application was withdrawn.</p>
      </div>
    )
  }

  const done = completedCount(status, assignment, invoice)
  const visibleSteps = status === 'REJECTED' ? TIMELINE_STEPS.slice(0, 3) : TIMELINE_STEPS

  return (
    <div className="space-y-3">
      <div className="flex items-start">
        {visibleSteps.map((label, i) => {
          const isDone = i < done
          const isActive = i === done && status !== 'REJECTED'
          const isRejected = status === 'REJECTED' && i === 2
          const isConditional = status === 'CONDITIONALLY_APPROVED' && i === 2
          const displayLabel =
            isConditional ? 'Cond. Approved' : isRejected ? 'Rejected' : label

          return (
            <div key={label} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 transition-colors
                    ${isDone
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                        ? 'bg-card border-primary text-primary'
                        : isRejected
                          ? 'bg-destructive/20 border-destructive text-destructive'
                          : isConditional
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                            : 'bg-muted border-border text-muted-foreground'
                    }`}
                >
                  {isDone ? '✓' : isRejected ? '✕' : i + 1}
                </div>
                <span
                  className={`text-xs text-center leading-tight px-0.5
                    ${isDone || isActive
                      ? 'text-foreground font-medium'
                      : isRejected
                        ? 'text-destructive font-medium'
                        : isConditional
                          ? 'text-amber-400 font-medium'
                          : 'text-muted-foreground'
                    }`}
                >
                  {displayLabel}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`flex-1 h-px mt-3 mx-1.5 shrink ${i < done ? 'bg-primary' : 'bg-border'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {status === 'CONDITIONALLY_APPROVED' && (
        <p className="text-xs text-amber-400/80 pl-0.5">
          Awaiting additional documents before full approval
        </p>
      )}
      {status === 'REJECTED' && rejectionNote && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs font-medium text-destructive mb-0.5">Feedback from our team</p>
          <p className="text-xs text-destructive/80">{rejectionNote}</p>
        </div>
      )}
    </div>
  )
}

// ── Next-Step CTA Banner ─────────────────────────────────────────────────────

function CTABanner({
  status,
  assignment,
  invoice,
  rejectionNote,
  applicationId,
}: {
  status: string
  assignment: { id: string } | null
  invoice: { id: string; status: string } | null
  rejectionNote: string | null
  applicationId: string
}) {
  if (status === 'SUBMITTED') {
    return (
      <div className="border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg px-4 py-3">
        <p className="text-sm text-foreground">
          Your application is being reviewed. We&apos;ll notify you of any updates.
        </p>
      </div>
    )
  }

  if (status === 'UNDER_REVIEW') {
    return (
      <div className="border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg px-4 py-3">
        <p className="text-sm text-foreground">Our team is reviewing your application.</p>
      </div>
    )
  }

  if (status === 'CONDITIONALLY_APPROVED') {
    return (
      <div className="border-l-4 border-amber-500 bg-amber-500/10 rounded-r-lg px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">
          Action required: please upload any missing documents.
        </p>
        <Button size="sm" asChild className="shrink-0">
          <Link href="/vendor/documents">Upload Documents</Link>
        </Button>
      </div>
    )
  }

  if (status === 'APPROVED') {
    if (!invoice) {
      return (
        <div className="border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg px-4 py-3">
          <p className="text-sm text-foreground">Approved! Your booth is being assigned.</p>
        </div>
      )
    }
    if (invoice.status === 'PAID') {
      return (
        <div className="border-l-4 border-green-500 bg-green-500/10 rounded-r-lg px-4 py-3">
          <p className="text-sm text-foreground font-medium">You&apos;re all set! See you at the fair. 🎉</p>
        </div>
      )
    }
    return (
      <div className="border-l-4 border-amber-500 bg-amber-500/10 rounded-r-lg px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">
          Action required: pay your invoice to secure your booth.
        </p>
        <Button size="sm" asChild className="shrink-0">
          <Link href={`/vendor/invoices/${invoice.id}`}>Pay Invoice</Link>
        </Button>
      </div>
    )
  }

  if (status === 'REJECTED') {
    return (
      <div className="border-l-4 border-destructive bg-destructive/10 rounded-r-lg px-4 py-3 space-y-3">
        <p className="text-sm text-foreground">Your application was not approved.</p>
        {rejectionNote && (
          <p className="text-xs text-muted-foreground">{rejectionNote}</p>
        )}
        <Button size="sm" asChild>
          <Link href={`/vendor/applications/${applicationId}/edit`}>Edit &amp; Resubmit</Link>
        </Button>
      </div>
    )
  }

  return null
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const documentsWithUrls = await Promise.all(
    application.documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(doc.fileUrl, 3600)
      const displayName = doc.fileName.includes('/')
        ? doc.fileName.split('/').pop() ?? doc.fileName
        : doc.fileName
      return { ...doc, signedUrl: data?.signedUrl ?? null, displayName }
    })
  )

  const { assignment, invoice } = application
  const booth = assignment?.booth

  const timelineAssignment = assignment ? { id: assignment.id } : null
  const timelineInvoice = invoice ? { id: invoice.id, status: invoice.status } : null

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

      {/* Status timeline */}
      {application.status !== 'DRAFT' && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <StatusTimeline
              status={application.status}
              assignment={timelineAssignment}
              invoice={timelineInvoice}
              rejectionNote={application.rejectionNote}
            />
          </CardContent>
        </Card>
      )}

      {/* Next-step CTA banner */}
      {application.status !== 'DRAFT' && application.status !== 'WITHDRAWN' && (
        <CTABanner
          status={application.status}
          assignment={timelineAssignment}
          invoice={timelineInvoice}
          rejectionNote={application.rejectionNote}
          applicationId={application.id}
        />
      )}

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
          {application.productDescription && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-foreground">{application.productDescription}</p>
              </div>
            </>
          )}
          {application.productCategory && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-foreground">{application.productCategory}</p>
              </div>
            </>
          )}
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
                      {doc.displayName}
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
