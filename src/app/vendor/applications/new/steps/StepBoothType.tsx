'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BoothType } from '../ApplicationWizard'

type Props = {
  boothTypes: BoothType[]
  selectedWeeksCount: number
  selectedBoothType: BoothType | null
  onNext: (boothType: BoothType) => void
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

export default function StepBoothType({
  boothTypes,
  selectedWeeksCount,
  selectedBoothType: initialSelected,
  onNext,
  onBack,
  isLoading,
}: Props) {
  const [selected, setSelected] = useState<BoothType | null>(initialSelected)

  const total = selected ? selected.basePrice * selectedWeeksCount : null

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Select booth type</p>
        <div className="space-y-3">
          {boothTypes.map((bt) => {
            const isSelected = selected?.id === bt.id
            return (
              <button
                key={bt.id}
                type="button"
                onClick={() => setSelected(bt)}
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
                    {bt.docRequirements.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bt.docRequirements.map((dr) => (
                          <span
                            key={dr.docType}
                            className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                          >
                            {DOC_LABELS[dr.docType] ?? dr.docType}
                            {dr.required && ' *'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      ${bt.basePrice}
                      <span className="font-normal text-muted-foreground">/wk</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bt.totalCount} spots
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selected && total !== null && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.name} × {selectedWeeksCount} week{selectedWeeksCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm font-medium text-foreground">${total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => selected && onNext(selected)} disabled={!selected || isLoading}>
          {isLoading ? 'Saving…' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
