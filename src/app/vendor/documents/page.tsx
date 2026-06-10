import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'status-badge-draft',
  VERIFIED: 'status-badge-approved',
  REJECTED: 'status-badge-rejected',
  EXPIRED: 'status-badge-pending',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function VendorDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/auth/login')

  const documents = await prisma.document.findMany({
    where: { vendorId: vendorProfile.id },
    include: {
      application: { include: { event: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">My documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Uploaded documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs mt-1">Documents are uploaded during the application process</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Document</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">File name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Application</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Uploaded</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-foreground">
                        {DOC_LABELS[doc.docType] ?? doc.docType}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs max-w-50 truncate">
                        {doc.fileName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {doc.application?.event.name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status] ?? 'status-badge-draft'}`}
                        >
                          {doc.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
