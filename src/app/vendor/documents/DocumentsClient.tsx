'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

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

type Doc = {
  id: string
  docType: string
  fileName: string
  fileUrl: string
  signedUrl: string | null
  status: string
  uploadedAt: string
  applicationId: string | null
  applicationStatus: string | null
  eventName: string | null
}

type Props = {
  initialDocs: Doc[]
  vendorProfileId: string
}

const BLOCKING_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'CONDITIONALLY_APPROVED', 'APPROVED']

function isDeletable(doc: Doc) {
  return !doc.applicationStatus || !BLOCKING_STATUSES.includes(doc.applicationStatus)
}

export default function DocumentsClient({ initialDocs, vendorProfileId }: Props) {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadDocType, setUploadDocType] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleDeleteDoc(id: string) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/vendor/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Delete failed')
        return
      }
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleStandaloneUpload() {
    if (!uploadFile || !uploadDocType) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const path = `${vendorProfileId}/${Date.now()}-${uploadFile.name}`
      const { error: storageError } = await supabase.storage
        .from('vendor-documents')
        .upload(path, uploadFile)
      if (storageError) throw new Error(storageError.message)

      const res = await fetch('/api/vendor/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: uploadDocType,
          fileName: uploadFile.name,
          fileUrl: path,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save document')
      }

      setUploadDocType('')
      setUploadFile(null)
      router.refresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">My documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {docs.length} document{docs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Upload panel */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3">Upload a document</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={uploadDocType}
            onChange={(e) => setUploadDocType(e.target.value)}
            className="border border-border rounded px-3 py-2 text-sm bg-background text-foreground"
          >
            <option value="">Select document type…</option>
            <option value="BUSINESS_LICENSE">Business License</option>
            <option value="SELLERS_PERMIT">Seller's Permit</option>
            <option value="HEALTH_PERMIT">Health Permit</option>
            <option value="FOOD_HANDLER">Food Handler Certificate</option>
            <option value="INSURANCE">Insurance Certificate</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="text-sm text-foreground"
          />
          <button
            onClick={handleStandaloneUpload}
            disabled={!uploadDocType || !uploadFile || uploading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {uploadError && <p className="text-xs text-destructive mt-2">{uploadError}</p>}
      </div>

      {/* Documents table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Uploaded documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs mt-1">Use the upload panel above to add documents</p>
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
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-foreground">
                        {DOC_LABELS[doc.docType] ?? doc.docType}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs max-w-[200px] truncate">
                        {doc.signedUrl ? (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {doc.fileName}
                          </a>
                        ) : (
                          doc.fileName
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {doc.eventName ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status] ?? 'status-badge-draft'}`}
                        >
                          {doc.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        {isDeletable(doc) && (
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            disabled={deletingId === doc.id}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors disabled:opacity-40"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
