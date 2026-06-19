'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EventData, BoothType, EventWeek } from '../ApplicationWizard'

type Props = {
  event: EventData
  selectedWeeks: EventWeek[]
  boothType: BoothType
  uploadedDocTypes: string[]
  onSubmit: () => void
  onBack: () => void
  isLoading: boolean
}

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StepReview({
  event,
  selectedWeeks,
  boothType,
  uploadedDocTypes,
  onSubmit,
  onBack,
  isLoading,
}: Props) {
  const total = boothType.basePrice * selectedWeeks.length

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Review your application before submitting.
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Event</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-medium text-foreground">{event.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(event.eventDateStart)} – {formatDate(event.eventDateEnd)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Weeks selected ({selectedWeeks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {selectedWeeks.map((w) => (
            <p key={w.id} className="text-sm text-foreground">
              {w.label}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Booth type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{boothType.name}</p>
            <p className="text-sm text-muted-foreground">
              ${boothType.basePrice}/wk × {selectedWeeks.length}
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Total</p>
            <p className="text-sm font-semibold text-primary">${total.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Documents ({uploadedDocTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {uploadedDocTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No documents uploaded</p>
          ) : (
            uploadedDocTypes.map((dt) => (
              <p key={dt} className="text-sm text-foreground">
                {DOC_LABELS[dt] ?? dt}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Submitting…' : 'Submit application'}
        </Button>
      </div>
    </div>
  )
}
