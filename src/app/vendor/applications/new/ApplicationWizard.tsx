'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import StepWeeks from './steps/StepWeeks'
import StepBoothType from './steps/StepBoothType'
import StepDocuments from './steps/StepDocuments'
import StepReview from './steps/StepReview'
import {
  createDraftApplication,
  updateApplicationWeeks,
  updateApplicationBoothType,
  submitApplication,
} from '@/lib/applications'

export type EventWeek = {
  id: string
  label: string
  startDate: string
  endDate: string
  sortOrder: number
}

export type DocRequirement = {
  docType: string
  required: boolean
  notes: string | null
}

export type BoothType = {
  id: string
  name: string
  description: string | null
  basePrice: number
  sizeSqft: number | null
  totalCount: number
  sortOrder: number
  docRequirements: DocRequirement[]
}

export type EventData = {
  id: string
  name: string
  description: string | null
  eventDateStart: string
  eventDateEnd: string
  hours: string | null
  address: string | null
  city: string | null
  state: string | null
  weeks: EventWeek[]
  boothTypes: BoothType[]
}

type Props = {
  event: EventData
  vendorProfileId: string
}

const STEP_LABELS = ['Event & Weeks', 'Booth Type', 'Documents', 'Review']

export default function ApplicationWizard({ event, vendorProfileId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>([])
  const [selectedBoothType, setSelectedBoothType] = useState<BoothType | null>(null)
  const [uploadedDocTypes, setUploadedDocTypes] = useState<string[]>([])

  async function handleWeeksNext(weekIds: string[]) {
    if (weekIds.length === 0) {
      toast.error('Select at least one week')
      return
    }
    setIsLoading(true)
    try {
      let appId = applicationId
      if (!appId) {
        const result = await createDraftApplication(event.id)
        if (result.error) throw new Error(result.error)
        appId = result.applicationId
        setApplicationId(appId)
      }
      const result = await updateApplicationWeeks(appId, weekIds)
      if (result.error) throw new Error(result.error)
      setSelectedWeekIds(weekIds)
      setStep(2)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBoothTypeNext(boothType: BoothType) {
    if (!applicationId) return
    setIsLoading(true)
    try {
      const result = await updateApplicationBoothType(applicationId, boothType.id)
      if (result.error) throw new Error(result.error)
      setSelectedBoothType(boothType)
      setStep(3)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  function handleDocumentsNext(docTypes: string[]) {
    setUploadedDocTypes(docTypes)
    setStep(4)
  }

  async function handleSubmit() {
    if (!applicationId) return
    setIsLoading(true)
    try {
      const result = await submitApplication(applicationId)
      if (result.error) throw new Error(result.error)
      toast.success('Application submitted!')
      router.push('/vendor/dashboard')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const selectedWeeks = event.weeks.filter((w) => selectedWeekIds.includes(w.id))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">New application</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{event.name}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const isActive = step === n
          const isDone = step > n
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
                    ${isActive ? 'border-primary bg-primary text-primary-foreground' : isDone ? 'border-primary bg-card text-primary' : 'border-border bg-muted text-muted-foreground'}`}
                >
                  {isDone ? '✓' : n}
                </div>
                <span
                  className={`text-xs mt-1 whitespace-nowrap ${isActive ? 'text-foreground font-medium' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 mb-4 ${step > n ? 'bg-primary' : 'bg-border'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <StepWeeks
          event={event}
          selectedWeekIds={selectedWeekIds}
          onNext={handleWeeksNext}
          isLoading={isLoading}
        />
      )}
      {step === 2 && (
        <StepBoothType
          boothTypes={event.boothTypes}
          selectedWeeksCount={selectedWeekIds.length}
          selectedBoothType={selectedBoothType}
          onNext={handleBoothTypeNext}
          onBack={() => setStep(1)}
          isLoading={isLoading}
        />
      )}
      {step === 3 && selectedBoothType && applicationId && (
        <StepDocuments
          docRequirements={selectedBoothType.docRequirements}
          applicationId={applicationId}
          vendorProfileId={vendorProfileId}
          onNext={handleDocumentsNext}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && selectedBoothType && (
        <StepReview
          event={event}
          selectedWeeks={selectedWeeks}
          boothType={selectedBoothType}
          uploadedDocTypes={uploadedDocTypes}
          onSubmit={handleSubmit}
          onBack={() => setStep(3)}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
