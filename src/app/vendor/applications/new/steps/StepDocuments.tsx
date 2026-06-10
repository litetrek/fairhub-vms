'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { uploadDocument } from '@/lib/storage'
import { createDocumentRecord } from '@/lib/applications'
import type { DocRequirement } from '../ApplicationWizard'

type Props = {
  docRequirements: DocRequirement[]
  applicationId: string
  vendorProfileId: string
  onNext: (uploadedDocTypes: string[]) => void
  onBack: () => void
}

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

type DocState = {
  status: 'idle' | 'uploading' | 'uploaded' | 'error'
  fileName?: string
  error?: string
}

export default function StepDocuments({
  docRequirements,
  applicationId,
  vendorProfileId,
  onNext,
  onBack,
}: Props) {
  const [docStates, setDocStates] = useState<Record<string, DocState>>(
    Object.fromEntries(docRequirements.map((dr) => [dr.docType, { status: 'idle' }]))
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function setDocState(docType: string, state: Partial<DocState>) {
    setDocStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], ...state },
    }))
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

  const requiredDocs = docRequirements.filter((dr) => dr.required)
  const allRequiredUploaded = requiredDocs.every(
    (dr) => docStates[dr.docType]?.status === 'uploaded'
  )
  const uploadedDocTypes = Object.entries(docStates)
    .filter(([, s]) => s.status === 'uploaded')
    .map(([docType]) => docType)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Upload required documents</p>
        <p className="text-xs text-muted-foreground">
          Documents marked with <span className="text-primary font-semibold">*</span> are required before you can proceed.
        </p>
      </div>

      <div className="space-y-3">
        {docRequirements.map((dr) => {
          const state = docStates[dr.docType] ?? { status: 'idle' }
          return (
            <Card key={dr.docType} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {DOC_LABELS[dr.docType] ?? dr.docType}
                      {dr.required && <span className="text-primary ml-0.5">*</span>}
                    </p>
                    {dr.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{dr.notes}</p>
                    )}
                    {state.status === 'uploaded' && state.fileName && (
                      <p className="text-xs text-green-600 mt-1">{state.fileName}</p>
                    )}
                    {state.status === 'error' && state.error && (
                      <p className="text-xs text-red-500 mt-1">{state.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {state.status === 'uploaded' && (
                      <span className="text-xs text-green-600 font-medium">Uploaded</span>
                    )}
                    {state.status === 'uploading' && (
                      <span className="text-xs text-muted-foreground">Uploading…</span>
                    )}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[dr.docType] = el
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, dr.docType)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={state.status === 'uploading'}
                      onClick={() => fileInputRefs.current[dr.docType]?.click()}
                    >
                      {state.status === 'uploaded' ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onNext(uploadedDocTypes)} disabled={!allRequiredUploaded}>
          Next
        </Button>
      </div>
    </div>
  )
}
