import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ApplicationActions from './ApplicationActions'
import BoothAssignForm from './BoothAssignForm'

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_CREATED:          'Application created',
  APPLICATION_SUBMITTED:        'Application submitted',
  APPLICATION_RESUBMITTED:      'Application resubmitted',
  APPLICATION_WITHDRAWN:        'Application withdrawn',
  APPLICATION_DELETED:          'Application deleted',
  DOCUMENT_UPLOADED:            'Document uploaded',
  DOCUMENT_REUSED:              'Document reused from prior application',
  DOCUMENT_DELETED:             'Document deleted',
  STANDALONE_DOCUMENT_UPLOADED: 'Document uploaded (standalone)',
  STANDALONE_DOCUMENT_DELETED:  'Document deleted (standalone)',
  LOGIN:                        'Vendor logged in',
  LOGOUT:                       'Vendor logged out',
  PROFILE_UPDATED:              'Profile updated',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700',
  CONDITIONALLY_APPROVED: 'bg-purple-50 text-purple-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Conditionally approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
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
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

function formatDate(date: Date | null) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function StaffApplicationDetailPage({
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

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      vendor: { include: { user: true } },
      event: true,
      boothType: { include: { docRequirements: true } },
      weeks: {
        include: { eventWeek: true },
        orderBy: { eventWeek: { sortOrder: 'asc' } },
      },
      documents: true,
      approvalLogs: {
        include: { reviewedBy: true },
        orderBy: { actionedAt: 'desc' },
        take: 10,
      },
      assignment: { include: { booth: true } },
      invoice: {
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  })

  if (!application) notFound()

  const activityLogs = await prisma.vendorActivityLog.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, action: true, detail: true, createdAt: true },
  })

  const total = application.boothType
    ? Number(application.boothType.basePrice) * application.weeks.length
    : null

  const assignment = application.assignment
  const boothData = assignment
    ? {
        boothNumber: assignment.booth.boothNumber,
        zone: assignment.booth.zone,
        notes: assignment.notes,
      }
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
              <Link href="/staff/queue">← Queue</Link>
            </Button>
          </div>
          <h1 className="text-xl font-medium text-slate-900">Application review</h1>
          <p className="text-sm text-slate-500 mt-0.5">{application.event.name}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[application.status] ?? 'bg-slate-100 text-slate-600'}`}
        >
          {statusLabels[application.status] ?? application.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Vendor info */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="font-medium text-slate-900">{application.vendor.contactName}</p>
              <p className="text-slate-500">{application.vendor.businessName}</p>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>{application.vendor.user.email}</p>
              {application.vendor.user.phone && <p>{application.vendor.user.phone}</p>}
              {application.vendor.city && (
                <p>
                  {[application.vendor.address, application.vendor.city, application.vendor.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application summary */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Booth type</p>
              <p className="text-slate-700">
                {application.boothType?.name ?? '—'}
                {application.boothType?.sizeSqft &&
                  ` (${application.boothType.sizeSqft} sqft)`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">
                Weeks ({application.weeks.length})
              </p>
              {application.weeks.map((w) => (
                <p key={w.id} className="text-slate-700">
                  {w.eventWeek.label}
                </p>
              ))}
            </div>
            {total !== null && (
              <div>
                <p className="text-xs text-slate-400">Estimated total</p>
                <p className="text-slate-700 font-medium">${total.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Submitted</p>
              <p className="text-slate-700">{formatDate(application.submittedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Documents ({application.documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.documents.length === 0 ? (
            <p className="text-xs text-slate-400">No documents uploaded</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {application.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-slate-700">
                      {DOC_LABELS[doc.docType] ?? doc.docType}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        doc.status === 'VERIFIED'
                          ? 'bg-green-50 text-green-600'
                          : doc.status === 'REJECTED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.status.toLowerCase()}
                    </span>
                    <a
                      href={`/api/documents/view?path=${encodeURIComponent(doc.fileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval log */}
      {application.approvalLogs.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {application.approvalLogs.map((log) => (
                <div key={log.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{log.reviewedBy.email}</span>
                      {' — '}
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(log.actionedAt)}</p>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor activity log */}
      {activityLogs.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendor activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {activityLogs.map((log) => (
                <div key={log.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-700">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {log.detail && (
                      <span className="text-slate-400 ml-2">— {log.detail}</span>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs shrink-0 ml-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booth assignment — visible for APPROVED status */}
      {application.status === 'APPROVED' && (
        <BoothAssignForm applicationId={application.id} existing={boothData} />
      )}

      {/* Invoice summary — visible once booth is assigned */}
      {application.invoice && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-slate-900">
                  {application.invoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-400">
                  Issued {formatDate(application.invoice.issuedAt)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[application.invoice.status] ?? 'bg-slate-100 text-slate-600'}`}
              >
                {application.invoice.status.toLowerCase().replace(/_/g, ' ')}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {application.invoice.lineItems.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <p className="text-slate-700">{item.description}</p>
                  <p className="text-slate-700 font-medium">
                    ${Number(item.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <p className="font-medium text-slate-900">Total</p>
              <p className="font-medium text-slate-900">
                ${Number(application.invoice.total).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <ApplicationActions
        applicationId={application.id}
        currentStatus={application.status}
        hasBoothAssignment={!!application.assignment}
        existingInvoiceId={application.invoice?.id ?? null}
      />
    </div>
  )
}
