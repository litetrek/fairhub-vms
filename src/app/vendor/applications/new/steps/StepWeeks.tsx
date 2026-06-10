'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EventData } from '../ApplicationWizard'

type Props = {
  event: EventData
  selectedWeekIds: string[]
  onNext: (weekIds: string[]) => void
  isLoading: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StepWeeks({
  event,
  selectedWeekIds: initialSelected,
  onNext,
  isLoading,
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialSelected)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{event.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(event.eventDateStart)} – {formatDate(event.eventDateEnd)}
              {event.hours ? ` · ${event.hours}` : ''}
            </p>
            {(event.city || event.state) && (
              <p className="text-xs text-muted-foreground">
                {[event.address, event.city, event.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          {event.description && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{event.description}</p>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Select weeks to attend
          <span className="text-muted-foreground font-normal ml-1">(select all that apply)</span>
        </p>
        <div className="space-y-2">
          {event.weeks.map((week) => {
            const isSelected = selected.includes(week.id)
            return (
              <button
                key={week.id}
                type="button"
                onClick={() => toggle(week.id)}
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
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
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

      <div className="flex justify-end pt-2">
        <Button onClick={() => onNext(selected)} disabled={isLoading || selected.length === 0}>
          {isLoading ? 'Saving…' : `Next — ${selected.length} week${selected.length !== 1 ? 's' : ''} selected`}
        </Button>
      </div>
    </div>
  )
}
