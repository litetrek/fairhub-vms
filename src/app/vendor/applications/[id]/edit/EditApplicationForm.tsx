'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { uploadDocument } from '@/lib/storage'
import {
  updateApplicationWeeks,
  updateApplicationBoothType,
  createDocumentRecord,
  submitApplication,
} from '@/lib/applications'

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

type Week = { id: string; label: string; startDate: string; endDate: string }
type BoothType = {
  id: string
  name: string
  description: string | null
  basePrice: number
  sizeSqft: number | null
  docRequirements: { docType: string; required: boolean }[]
}
type ExistingDoc = { id: string; docType: string; fileName: string }

type Props = {
  applicationId: string
  vendorProfileId: string
  eventWeeks: Week[]
  boothTypes: BoothType[]
  initialWeekIds: string[]
  initialBoothTypeId: string | null
  existingDocs: ExistingDoc[]
}

type DocUploadState = {
  status: 'idle' | 'uploading' | 'uploaded' | 'error'
  fileName?: string
  error?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EditApplicationForm({
  applicationId,
  vendorProfileId,
  eventWeeks,
  boothTypes,
  initialWeekIds,
  initialBoothTypeId,
  existingDocs,
}: Props) {
  const router = useRouter()
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>(initialWeekIds)
  const [selectedBoothTypeId, setSelectedBoothTypeId] = useState<string | null>(
    initialBoothTypeId
  )
  const [docStates, setDocStates] = useState<Record<string, DocUploadState>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedBoothType = boothTypes.find((bt) => bt.id === selectedBoothTypeId) ?? null

  function toggleWeek(id: string) {
    setSelectedWeekIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function setDocState(docType: string, state: Partial<DocUploadState>) {
    setDocStates((prev) => ({ ...prev, [docType]: { ...prev[docType], ...state } }))
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setDocState(docType, { status: 'uploading', error: undefined })

    const { path, fileName, error } = await uploadDocument(
      file,
      vendorProfileId,
      applicationId,
      docType
    )
    if (error) {
      setDocState(docType, { status: 'error', error })
      return
    }

    const result = await createDocumentRecord({
      applicationId,
      docType,
      fileName,
      fileUrl: path,
    })
    if (result.error) {
      setDocState(docType, { status: 'error', error: result.error })
      return
    }

    setDocState(docType, { status: 'uploaded', fileName })
  }

  async function handleResubmit() {
    if (selectedWeekIds.length === 0) {
      toast.error('Select at least one week')
      return
    }
    if (!selectedBoothTypeId) {
      toast.error('Select a booth type')
      return
    }

    setIsSubmitting(true)
    try {
      let result = await updateApplicationWeeks(applicationId, selectedWeekIds)
      if (result.error) throw new Error(result.error)

      result = await updateApplicationBoothType(applicationId, selectedBoothTypeId)
      if (result.error) throw new Error(result.error)

      result = await submitApplication(applicationId)
      if (result.error) throw new Error(result.error)

      toast.success('Application resubmitted')
      router.push('/vendor/dashboard')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  const estimatedTotal =
    selectedBoothType && selectedWeekIds.length > 0
      ? selectedBoothType.basePrice * selectedWeekIds.length
      : null

  return (
    <div className="space-y-6">
      {/* Week selection */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Select weeks to attend
        </p>
        <div className="space-y-2">
          {eventWeeks.map((week) => {
            const isSelected = selectedWeekIds.includes(week.id)
            return (
              <button
                key={week.id}
                type="button"
                onClick={() => toggleWeek(week.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{week.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(week.startDate)} – {formatDate(week.endDate)}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                      ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Booth type selection */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Select booth type</p>
        <div className="space-y-3">
          {boothTypes.map((bt) => {
            const isSelected = selectedBoothTypeId === bt.id
            return (
              <button
                key={bt.id}
                type="button"
                onClick={() => setSelectedBoothTypeId(bt.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{bt.name}</p>
                      {bt.sizeSqft && (
                        <span className="text-xs text-muted-foreground">{bt.sizeSqft} sqft</span>
                      )}
                    </div>
                    {bt.description && (
                      <p className="text-xs text-muted-foreground mt-1">{bt.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground shrink-0">
                    ${bt.basePrice}
                    <span className="font-normal text-muted-foreground">/wk</span>
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        {estimatedTotal !== null && (
          <Card className="mt-3">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  {selectedBoothType!.name} × {selectedWeekIds.length}{' '}
                  week{selectedWeekIds.length !== 1 ? 's' : ''}
                </p>
                <p className="font-medium text-foreground">${estimatedTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Document uploads */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Documents</p>
        <p className="text-xs text-muted-foreground mb-3">
          Replace any documents that need updating. Existing uploads are kept unless replaced.
        </p>
        {existingDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents on file.</p>
        ) : (
          <div className="space-y-3">
            {existingDocs.map((doc) => {
              const state = docStates[doc.docType] ?? { status: 'idle' }
              return (
                <Card key={doc.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {DOC_LABELS[doc.docType] ?? doc.docType}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {state.status === 'uploaded'
                            ? state.fileName
                            : state.status === 'error'
                              ? state.error
                              : doc.fileName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {state.status === 'uploaded' && (
                          <span className="text-xs text-accent font-medium">Replaced</span>
                        )}
                        {state.status === 'uploading' && (
                          <span className="text-xs text-muted-foreground">Uploading…</span>
                        )}
                        <input
                          ref={(el) => { fileInputRefs.current[doc.docType] = el }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, doc.docType)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={state.status === 'uploading'}
                          onClick={() => fileInputRefs.current[doc.docType]?.click()}
                        >
                          Replace
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleResubmit}
          disabled={
            isSubmitting ||
            selectedWeekIds.length === 0 ||
            !selectedBoothTypeId
          }
        >
          {isSubmitting ? 'Submitting…' : 'Save and resubmit'}
        </Button>
      </div>
    </div>
  )
}
